import { HealthConfigType } from 'src/health-config/health-config.enum';
import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'health_configs' })
export class HealthConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  limit_per_week: number;

  @Column()
  type: HealthConfigType;

  @Column()
  amount_per_coin: number;

  @Column()
  coin_amount_per_week: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
