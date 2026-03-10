import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MitigationRule } from '../db/entities/mitigation-rule.entity';
import { AttackEvent } from '../db/entities/attack-event.entity';
import { MitigationService } from './mitigation.service';

@Module({
  imports: [TypeOrmModule.forFeature([MitigationRule, AttackEvent])],
  providers: [MitigationService],
  exports: [MitigationService],
})
export class MitigationModule {}
