import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowRecord } from '../db/entities/flow-record.entity';
import { SimulatorService } from './simulator.service';
import { MitigationModule } from '../mitigation/mitigation.module';

@Module({
  imports: [TypeOrmModule.forFeature([FlowRecord]), MitigationModule],
  providers: [SimulatorService],
  exports: [SimulatorService],
})
export class SimulatorModule {}
