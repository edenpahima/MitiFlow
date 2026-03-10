import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowRecord } from '../db/entities/flow-record.entity';
import { AttackEvent } from '../db/entities/attack-event.entity';
import { MitigationRule } from '../db/entities/mitigation-rule.entity';
import { DetectionService } from './detection.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlowRecord, AttackEvent, MitigationRule]),
  ],
  providers: [DetectionService],
  exports: [DetectionService],
})
export class DetectionModule {}
