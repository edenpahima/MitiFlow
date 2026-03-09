import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DbModule } from './db/db.module';
import { SimulatorModule } from './simulator/simulator.module';
import { SimulateController } from './api/simulate.controller';
import { AttacksController } from './api/attacks.controller';
import { DetectionModule } from './detection/detection.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    DbModule,
    SimulatorModule,
    DetectionModule,
  ],
  controllers: [SimulateController, AttacksController],
})
export class AppModule {}
