import {
  Entity,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity({ name: 'coin_histories' })
export class CoinHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  wallet_address: string;

  @Column()
  coin_id: number;

  @Column()
  receive_date: Date;

  @Column()
  expired_date: Date;

  @Column()
  member_id: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  receive_amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  usege_amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  expired_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ActivityEntity, (activity) => activity.reciever_token)
  reciever_token_activities: ActivityEntity[];
}
