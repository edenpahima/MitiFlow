import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbModule } from './db/db.module';
import { SimulatorModule } from './simulator/simulator.module';
import { DetectionModule } from './detection/detection.module';
import { MitigationModule } from './mitigation/mitigation.module';
import { SimulateController } from './api/simulate.controller';
import { AttacksController } from './api/attacks.controller';
import { MitigationController } from './api/mitigation.controller';
import { FlowsController } from './api/flows.controller';
import { FlowRecord } from './db/entities/flow-record.entity';
import { AttackEvent } from './db/entities/attack-event.entity';
import { MitigationRule } from './db/entities/mitigation-rule.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    DbModule,
    SimulatorModule,
    DetectionModule,
    MitigationModule,
    TypeOrmModule.forFeature([FlowRecord, AttackEvent, MitigationRule]),
  ],
  controllers: [
    SimulateController,
    AttacksController,
    MitigationController,
    FlowsController,
  ],
})
export class AppModule {}
