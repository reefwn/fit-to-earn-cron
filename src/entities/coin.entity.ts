import {
  Entity,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActivityEntity } from './activity.entity';
import { CoinHistoryEntity } from './coin-history.entity';

@Entity({ name: 'coins' })
export class CoinEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  full_name: string;

  @Column()
  image: string;

  @Column()
  age: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ActivityEntity, (activity) => activity.receiver_token)
  receiver_token_activities: ActivityEntity[];

  @OneToMany(() => CoinHistoryEntity, (coin_histories) => coin_histories.coin)
  coin_histories: CoinHistoryEntity[];
}
