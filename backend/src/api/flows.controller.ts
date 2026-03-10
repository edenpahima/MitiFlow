import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowRecord } from '../db/entities/flow-record.entity';

@Controller('api/flows')
export class FlowsController {
  constructor(
    @InjectRepository(FlowRecord)
    private flowRepo: Repository<FlowRecord>,
  ) {}

  @Get('chart')
  async getChartData(@Query('windowSeconds') windowSeconds = '120') {
    const window = parseInt(windowSeconds);

    // Get PPS and BPS per 5-second bucket for the chart
    const rows = await this.flowRepo
      .createQueryBuilder('f')
      .select(
        `date_trunc('minute', f.timestamp) + 
        INTERVAL '5 seconds' * FLOOR(EXTRACT(SECOND FROM f.timestamp) / 5)`,
        'bucket',
      )
      .addSelect('SUM(f.packets)', 'totalPackets')
      .addSelect('SUM(f.bytes)', 'totalBytes')
      .addSelect(
        'SUM(CASE WHEN f."isAttack" = true THEN f.packets ELSE 0 END)',
        'attackPackets',
      )
      .where(`f.timestamp > NOW() - INTERVAL '${window} seconds'`)
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany<{
        bucket: string;
        totalPackets: string;
        totalBytes: string;
        attackPackets: string;
      }>();

    return rows.map((row) => ({
      time: new Date(row.bucket).toLocaleTimeString(),
      pps: Math.round(Number(row.totalPackets) / 5),
      bps: Math.round((Number(row.totalBytes) * 8) / 5),
      attackPps: Math.round(Number(row.attackPackets) / 5),
    }));
  }
}
