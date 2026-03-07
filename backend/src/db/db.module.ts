import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FlowRecord } from './entities/flow-record.entity';
import { AttackEvent } from './entities/attack-event.entity';
import { MitigationRule } from './entities/mitigation-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [FlowRecord, AttackEvent, MitigationRule],
        synchronize: true, // auto-creates tables, fine for dev
      }),
    }),
  ],
})
export class DbModule {}
