import {
  Entity,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ActivityEntity } from './activity.entity';
import { MemberEntity } from './member.entity';
import { CoinEntity } from './coin.entity';

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

  @OneToMany(() => ActivityEntity, (activity) => activity.receiver_token)
  receiver_token_activities: ActivityEntity[];

  @ManyToOne(() => MemberEntity, (member) => member.coin_histories)
  @JoinColumn({ name: 'member_id' })
  member: MemberEntity;

  @ManyToOne(() => CoinEntity, (coin) => coin.coin_histories)
  @JoinColumn({ name: 'coin_id' })
  coin: CoinEntity;
}
