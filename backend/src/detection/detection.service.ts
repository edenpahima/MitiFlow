import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interval } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { FlowRecord } from '../db/entities/flow-record.entity';
import { AttackEvent } from '../db/entities/attack-event.entity';

// ─── Thresholds ───────────────────────────────────────────────────────────────
const THRESHOLD_PPS = 300; // packets/sec toward one IP
const THRESHOLD_BPS = 10_000_000; // 50 Mbps toward one IP
const ANOMALY_MULTIPLIER = 10; // current window is 3x baseline → attack
const WINDOW_SECONDS = 30; // current traffic window
const BASELINE_SECONDS = 300; // 5 min baseline for anomaly detection
const MIN_PPS_FOR_ANOMALY = 100; // don't even run anomaly check below this

interface TrafficStats {
  dstIp: string;
  totalPackets: number;
  totalBytes: number;
  pps: number;
  bps: number;
  protocols: Record<string, number>;
  uniqueSrcIps: number;
}

@Injectable()
export class DetectionService {
  private readonly logger = new Logger(DetectionService.name);

  constructor(
    @InjectRepository(FlowRecord)
    private flowRepo: Repository<FlowRecord>,
    @InjectRepository(AttackEvent)
    private attackRepo: Repository<AttackEvent>,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── Main detection loop — runs every 5 seconds ───────────────────────────

  @Interval(5000)
  async detect() {
    const currentStats = await this.getCurrentWindowStats();
    this.logger.log(
      `Detection tick — ${currentStats.length} IPs, threshold hits: ${currentStats.filter((s) => this.thresholdDetector(s)).length}`,
    );
    this.logger.log(`Stats: ${JSON.stringify(currentStats.slice(0, 2))}`);
    for (const stat of currentStats) {
      const isThresholdAttack = this.thresholdDetector(stat);
      const isAnomalyAttack = await this.anomalyDetector(stat);
      if (isThresholdAttack || isAnomalyAttack) {
        await this.handleAttackDetected(stat);
      }
    }

    // Check if any active attacks have resolved
    await this.checkResolved(currentStats);
  }

  // ─── Threshold Detector ───────────────────────────────────────────────────
  // Simple: if PPS or BPS crosses a fixed limit → attack

  private thresholdDetector(stat: TrafficStats): boolean {
    return stat.pps > THRESHOLD_PPS || stat.bps > THRESHOLD_BPS;
  }

  // ─── Anomaly Detector ─────────────────────────────────────────────────────
  // Smarter: if current window is 3x the 5-minute baseline → attack

  private async anomalyDetector(stat: TrafficStats): Promise<boolean> {
    // Don't bother checking low traffic IPs
    if (stat.pps < MIN_PPS_FOR_ANOMALY) return false;

    const baseline = await this.flowRepo
      .createQueryBuilder('f')
      .select('SUM(f.packets)', 'totalPackets')
      .addSelect('SUM(f.bytes)', 'totalBytes')
      .where('f.dstIp = :ip', { ip: stat.dstIp })
      .andWhere(`f.timestamp > NOW() - INTERVAL '${BASELINE_SECONDS} seconds'`)
      .getRawOne<{ totalPackets: string; totalBytes: string }>();

    if (!baseline?.totalPackets) return false;

    const baselinePps = Number(baseline.totalPackets) / BASELINE_SECONDS;
    return stat.pps > baselinePps * ANOMALY_MULTIPLIER;
  }

  // ─── Attack Type Classifier ───────────────────────────────────────────────
  // Looks at flow characteristics to determine attack type

  private classifyAttack(stat: TrafficStats): AttackEvent['attackType'] {
    const { protocols, uniqueSrcIps, pps, bps } = stat;
    const bytesPerPacket = bps / 8 / (pps || 1);

    // UDP + high bytes per packet + few source IPs = amplification
    if (protocols['udp'] > 0 && bytesPerPacket > 500 && uniqueSrcIps < 10) {
      return 'udp-amplification';
    }

    // TCP + tiny packets + many source IPs = SYN flood
    if (protocols['tcp'] > 0 && bytesPerPacket < 100 && uniqueSrcIps > 50) {
      return 'syn-flood';
    }

    // ICMP dominant = ICMP flood
    if (
      (protocols['icmp'] ?? 0) > (protocols['tcp'] ?? 0) &&
      (protocols['icmp'] ?? 0) > (protocols['udp'] ?? 0)
    ) {
      return 'icmp-flood';
    }

    return 'unknown';
  }

  // ─── Severity Calculator ──────────────────────────────────────────────────

  //   private calculateSeverity(pps: number, bps: number): AttackEvent['severity'] {
  //     if (pps > THRESHOLD_PPS * 10 || bps > THRESHOLD_BPS * 10) return 'critical';
  //     if (pps > THRESHOLD_PPS * 5 || bps > THRESHOLD_BPS * 5) return 'high';
  //     if (pps > THRESHOLD_PPS * 2 || bps > THRESHOLD_BPS * 2) return 'medium';
  //     return 'low';
  //   }

  private calculateSeverity(pps: number, bps: number): AttackEvent['severity'] {
    // SYN floods are high PPS but low BPS — check PPS first
    if (pps > 1000 || bps > THRESHOLD_BPS * 10) return 'critical';
    if (pps > 500 || bps > THRESHOLD_BPS * 5) return 'high';
    if (pps > 300 || bps > THRESHOLD_BPS * 2) return 'medium';
    return 'low';
  }

  // ─── Handle New Attack ────────────────────────────────────────────────────

  private async handleAttackDetected(stat: TrafficStats) {
    this.logger.log(`handleAttackDetected called for ${stat.dstIp}`);
    const existing = await this.attackRepo.findOne({
      where: { victimIp: stat.dstIp, status: 'active' },
    });

    if (existing) return;

    const attack = this.attackRepo.create({
      id: uuidv4(),
      victimIp: stat.dstIp,
      attackType: this.classifyAttack(stat),
      severity: this.calculateSeverity(stat.pps, stat.bps),
      pps: stat.pps,
      bps: stat.bps,
      status: 'active',
    });

    try {
      await this.attackRepo.save(attack);
      this.logger.log(`Attack saved to DB: ${attack.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to save attack: ${message}`);
    }

    this.logger.warn(
      `Attack detected: ${attack.attackType} → ${attack.victimIp} [${attack.severity}] PPS: ${Math.round(attack.pps)} BPS: ${Math.round(attack.bps)}`,
    );

    this.eventEmitter.emit('attack.detected', attack);
  }

  // ─── Check Resolved ───────────────────────────────────────────────────────
  // If an IP that was under attack now has normal traffic → mark resolved

  //   private async checkResolved(currentStats: TrafficStats[]) {
  //     const activeAttacks = await this.attackRepo.find({
  //       where: { status: 'active' },
  //     });

  //     for (const attack of activeAttacks) {
  //       // Don't resolve an attack that was detected less than 15 seconds ago
  //       const ageSeconds =
  //         (Date.now() - new Date(attack.timestamp).getTime()) / 1000;
  //       if (ageSeconds < 15) continue;

  //       const currentStat = currentStats.find((s) => s.dstIp === attack.victimIp);
  //       const isStillUnderAttack =
  //         currentStat &&
  //         (currentStat.pps > THRESHOLD_PPS || currentStat.bps > THRESHOLD_BPS);

  //       if (!isStillUnderAttack) {
  //         attack.status = 'resolved';
  //         await this.attackRepo.save(attack);
  //         this.logger.log(`Attack resolved for ${attack.victimIp}`);
  //         this.eventEmitter.emit('attack.resolved', attack);
  //       }
  //     }
  //   }
  private async checkResolved(currentStats: TrafficStats[]) {
    // Only consider attacks that have been active for at least 15 seconds
    const activeAttacks = await this.attackRepo
      .createQueryBuilder('a')
      .where('a.status = :status', { status: 'active' })
      .andWhere(`a.timestamp < NOW() - INTERVAL '15 seconds'`)
      .getMany();

    for (const attack of activeAttacks) {
      const currentStat = currentStats.find((s) => s.dstIp === attack.victimIp);
      const isStillUnderAttack =
        currentStat &&
        (currentStat.pps > THRESHOLD_PPS || currentStat.bps > THRESHOLD_BPS);

      if (!isStillUnderAttack) {
        attack.status = 'resolved';
        await this.attackRepo.save(attack);
        this.logger.log(`Attack resolved for ${attack.victimIp}`);
        this.eventEmitter.emit('attack.resolved', attack);
      }
    }
  }

  // ─── Query Helpers ────────────────────────────────────────────────────────

  private async getCurrentWindowStats(): Promise<TrafficStats[]> {
    const rows = await this.flowRepo
      .createQueryBuilder('f')
      .select('f.dstIp', 'dstIp')
      .addSelect('SUM(f.packets)', 'totalPackets')
      .addSelect('SUM(f.bytes)', 'totalBytes')
      .addSelect('COUNT(DISTINCT f.srcIp)', 'uniqueSrcIps')
      .where(`f.timestamp > NOW() - INTERVAL '${WINDOW_SECONDS} seconds'`)
      .groupBy('f.dstIp')
      .getRawMany<{
        dstIp: string;
        totalPackets: string;
        totalBytes: string;
        uniqueSrcIps: string;
      }>();

    const protocolRows = await this.flowRepo
      .createQueryBuilder('f')
      .select('f.dstIp', 'dstIp')
      .addSelect('f.protocol', 'protocol')
      .addSelect('COUNT(*)', 'count')
      .where(`f.timestamp > NOW() - INTERVAL '${WINDOW_SECONDS} seconds'`)
      .groupBy('f.dstIp')
      .addGroupBy('f.protocol')
      .getRawMany<{ dstIp: string; protocol: string; count: string }>();

    return rows.map((row) => {
      const totalPackets = Number(row.totalPackets);
      const totalBytes = Number(row.totalBytes);
      const protocols = protocolRows
        .filter((p) => p.dstIp === row.dstIp)
        .reduce<Record<string, number>>((acc, p) => {
          acc[p.protocol] = Number(p.count);
          return acc;
        }, {});

      return {
        dstIp: row.dstIp,
        totalPackets,
        totalBytes,
        pps: totalPackets / WINDOW_SECONDS,
        bps: (totalBytes * 8) / WINDOW_SECONDS,
        protocols,
        uniqueSrcIps: Number(row.uniqueSrcIps),
      };
    });
  }

  // ─── Public query methods for the API ─────────────────────────────────────

  async getAttacks(status?: string, limit = 50, victimIp?: string) {
    const query = this.attackRepo.createQueryBuilder('a');

    if (status && status !== 'all') {
      query.where('a.status = :status', { status });
    }
    if (victimIp) {
      query.andWhere('a.victimIp = :victimIp', { victimIp });
    }

    return query.orderBy('a.timestamp', 'DESC').limit(limit).getMany();
  }

  async getAttackById(id: string) {
    return this.attackRepo.findOne({ where: { id } });
  }

  //   async getStats() {
  //     const startOfDay = new Date();
  //     startOfDay.setHours(0, 0, 0, 0);

  //     const [activeAttacks, totalToday, mitigatedToday] = await Promise.all([
  //       this.attackRepo.count({ where: { status: 'active' } }),
  //       this.attackRepo
  //         .createQueryBuilder('a')
  //         .where(`a.timestamp > :startOfDay`, { startOfDay })
  //         .getCount(),
  //       this.attackRepo
  //         .createQueryBuilder('a')
  //         .where(`a.timestamp > :startOfDay`, { startOfDay })
  //         .andWhere('a.status = :status', { status: 'mitigated' })
  //         .getCount(),
  //     ]);

  //     return { activeAttacks, totalAttacksToday: totalToday, mitigatedToday };
  //   }

  async getStats() {
    const [activeAttacks, totalToday, mitigatedToday] = await Promise.all([
      this.attackRepo.count({ where: { status: 'active' } }),
      this.attackRepo
        .createQueryBuilder('a')
        .where(`a.timestamp > NOW() - INTERVAL '24 hours'`)
        .getCount(),
      this.attackRepo
        .createQueryBuilder('a')
        .where(`a.timestamp > NOW() - INTERVAL '24 hours'`)
        .andWhere('a.status = :status', { status: 'mitigated' })
        .getCount(),
    ]);

    return { activeAttacks, totalAttacksToday: totalToday, mitigatedToday };
  }
}
