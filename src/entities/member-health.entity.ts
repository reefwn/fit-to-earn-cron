import {
  MemberHealthType,
  MemberHealthStatus,
} from 'src/member-health/member-health.enum';
import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'member_healths' })
export class MemberHealthEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  point: number;

  @Column()
  type: MemberHealthType;

  @Column()
  status: MemberHealthStatus;

  @Column()
  point_use: number;

  @Column()
  point_remain: number;

  @Column()
  amount_receive: number;

  @Column()
  transaction_id: number;

  @Column()
  time_sync: Date;

  @Column()
  member_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
