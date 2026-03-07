import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('flow_records')
@Index(['timestamp'])
@Index(['dstIp', 'timestamp'])
export class FlowRecord {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  srcIp: string;

  @Column()
  dstIp: string;

  @Column()
  protocol: string; // 'tcp' | 'udp' | 'icmp'

  @Column()
  port: number;

  @Column('bigint')
  bytes: number;

  @Column('bigint')
  packets: number;

  @Column({ default: false })
  isAttack: boolean; // flag so we can visually distinguish in the dashboard
}
