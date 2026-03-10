import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interval } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { FlowRecord } from '../db/entities/flow-record.entity';
import { MitigationService } from 'src/mitigation/mitigation.service';

type Protocol = 'tcp' | 'udp' | 'icmp';
type Intensity = 'low' | 'medium' | 'high';

interface AttackState {
  type: 'syn-flood' | 'udp-amplification' | 'icmp-flood';
  victimIp: string;
  intensity: Intensity;
  amplificationFactor?: number;
  startedAt: Date;
}

// How many extra attack flows to inject per tick based on intensity
const INTENSITY_MULTIPLIER: Record<Intensity, number> = {
  low: 50,
  medium: 200,
  high: 500,
};

@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);
  private attackState: AttackState | null = null;

  constructor(
    @InjectRepository(FlowRecord)
    private flowRepo: Repository<FlowRecord>,
    private mitigationService: MitigationService,
  ) {}

  // Add this interval
  @Interval(60000)
  async expireRules() {
    await this.mitigationService.expireRules();
  }

  @Interval(60000)
  async cleanup() {
    await this.flowRepo
      .createQueryBuilder()
      .delete()
      .where("timestamp < NOW() - INTERVAL '10 minutes'")
      .execute();
    this.logger.log('Old flow records cleaned up');
  }
  // ─── Public methods called by the API ────────────────────────────────────

  startSynFlood(victimIp: string, intensity: Intensity) {
    this.attackState = {
      type: 'syn-flood',
      victimIp,
      intensity,
      startedAt: new Date(),
    };
    this.logger.log(`SYN flood started → ${victimIp} [${intensity}]`);
  }

  startUdpAmplification(
    victimIp: string,
    intensity: Intensity,
    amplificationFactor: number,
  ) {
    this.attackState = {
      type: 'udp-amplification',
      victimIp,
      intensity,
      amplificationFactor,
      startedAt: new Date(),
    };
    this.logger.log(`UDP amplification started → ${victimIp} [${intensity}]`);
  }

  startIcmpFlood(victimIp: string, intensity: Intensity) {
    this.attackState = {
      type: 'icmp-flood',
      victimIp,
      intensity,
      startedAt: new Date(),
    };
    this.logger.log(`ICMP flood started → ${victimIp} [${intensity}]`);
  }

  async stopAttack() {
    this.attackState = null;
    await this.mitigationService.withdrawAllActiveRules();
    this.logger.log('Attack simulation stopped');
  }

  getStatus() {
    return this.attackState
      ? { active: true, ...this.attackState }
      : { active: false };
  }

  // ─── Main loop — runs every 1 second ─────────────────────────────────────

  @Interval(1000)
  async tick() {
    const flows: Partial<FlowRecord>[] = [];

    // Always generate normal background traffic
    for (let i = 0; i < 20; i++) {
      flows.push(this.generateNormalFlow());
    }

    // If attack is active, check if it's being mitigated
    if (this.attackState) {
      const isMitigated = await this.mitigationService.hasActiveRule(
        this.attackState.victimIp,
      );

      if (!isMitigated) {
        const count = INTENSITY_MULTIPLIER[this.attackState.intensity];
        for (let i = 0; i < count; i++) {
          flows.push(this.generateAttackFlow(this.attackState));
        }
      } else {
        this.logger.log(
          `Attack traffic blocked by mitigation rule for ${this.attackState.victimIp}`,
        );
      }
    }

    await this.flowRepo.save(flows as FlowRecord[]);
  }

  // ─── Flow generators ──────────────────────────────────────────────────────

  private generateNormalFlow(): Partial<FlowRecord> {
    const protocols: Protocol[] = ['tcp', 'udp', 'icmp'];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    return {
      id: uuidv4(),
      srcIp: this.randomIp(),
      dstIp: this.randomIp(),
      protocol,
      port: this.randomPort(),
      bytes: this.randomInt(500, 15000),
      packets: this.randomInt(1, 10),
      isAttack: false,
    };
  }

  private generateAttackFlow(state: AttackState): Partial<FlowRecord> {
    switch (state.type) {
      case 'syn-flood':
        // Many small TCP packets (SYN = 60 bytes), random spoofed sources
        return {
          id: uuidv4(),
          srcIp: this.randomIp(), // spoofed
          dstIp: state.victimIp,
          protocol: 'tcp',
          port: 80,
          bytes: this.randomInt(60, 80), // tiny SYN packets
          packets: this.randomInt(1, 3),
          isAttack: true,
        };

      case 'udp-amplification':
        // Few sources (open resolvers), massive byte payloads
        return {
          id: uuidv4(),
          srcIp: this.randomOpenResolver(),
          dstIp: state.victimIp,
          protocol: 'udp',
          port: 53,
          bytes: this.randomInt(1000, 4000) * (state.amplificationFactor ?? 50),
          packets: this.randomInt(1, 5),
          isAttack: true,
        };

      case 'icmp-flood':
        return {
          id: uuidv4(),
          srcIp: this.randomIp(),
          dstIp: state.victimIp,
          protocol: 'icmp',
          port: 0,
          bytes: this.randomInt(64, 128),
          packets: this.randomInt(1, 3),
          isAttack: true,
        };
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private randomIp(): string {
    return `${this.randomInt(1, 254)}.${this.randomInt(0, 255)}.${this.randomInt(0, 255)}.${this.randomInt(0, 255)}`;
  }

  // Small pool of IPs simulating open DNS resolvers
  private randomOpenResolver(): string {
    const resolvers = [
      '8.8.8.8',
      '8.8.4.4',
      '1.1.1.1',
      '9.9.9.9',
      '208.67.222.222',
      '64.6.64.6',
    ];
    return resolvers[Math.floor(Math.random() * resolvers.length)];
  }

  private randomPort(): number {
    const common = [80, 443, 53, 22, 25, 3306, 5432];
    return common[Math.floor(Math.random() * common.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
