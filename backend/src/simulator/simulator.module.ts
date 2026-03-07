import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowRecord } from '../db/entities/flow-record.entity';
import { SimulatorService } from './simulator.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlowRecord])],
  providers: [SimulatorService],
  exports: [SimulatorService],
})
export class SimulatorModule {}
