import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('attack_events')
export class AttackEvent {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  victimIp: string;

  @Column()
  attackType: string; // 'syn-flood' | 'udp-amplification' | 'icmp-flood' | 'unknown'

  @Column()
  severity: string; // 'low' | 'medium' | 'high' | 'critical'

  @Column('float')
  pps: number;

  @Column('float')
  bps: number;

  @Column({ default: 'active' })
  status: string; // 'active' | 'mitigated' | 'resolved'
}
