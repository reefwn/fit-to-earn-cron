import {
  ActivityType,
  ActivityRequireRegister,
  ActivityVerificationType,
  ActivityRequireCheckinCheckout,
} from 'src/activity/activity.enum';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'activities' })
export class ActivityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  detail: string;

  @Column()
  participant_limit: number;

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @Column()
  location_detail: string;

  @Column()
  location_name: string;

  @Column()
  activity_type: ActivityType;

  @Column()
  verification_type: ActivityVerificationType;

  @Column()
  receiver_token_type: string;

  @Column()
  password: string;

  @Column()
  category_id: number;

  @Column()
  thumbnail_image: string;

  @Column()
  image1: string;

  @Column()
  image2: string;

  @Column()
  image3: string;

  @Column()
  image4: string;

  @Column()
  image5: string;

  @Column()
  cumulative_minute: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount_giveaways: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  penalty1_amount: number;

  @Column()
  penalty1_coin_id: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  penalty2_amount: number;

  @Column()
  penalty2_coin_id: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  penalty3_amount: number;

  @Column()
  penalty3_coin_id: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  penalty4_amount: number;

  @Column()
  penalty4_coin_id: number;

  @Column()
  penalty_period: number;

  @Column()
  status: string;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column()
  enroll_startdate: Date;

  @Column()
  enroll_enddate: Date;

  @Column()
  start_checkin: Date;

  @Column()
  start_checkout: Date;

  @Column()
  final_checkin: Date;

  @Column()
  final_checkout: Date;

  @Column()
  qr_checkin: string;

  @Column()
  qr_checkout: string;

  @Column()
  req_register: ActivityRequireRegister;

  @Column()
  req_checkin: ActivityRequireCheckinCheckout;

  @Column()
  req_checkout: ActivityRequireCheckinCheckout;

  @Column()
  minimum_csrtime: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
