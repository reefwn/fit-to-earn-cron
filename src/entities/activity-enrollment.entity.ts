import { ActivityEnrollmentStatus } from 'src/activity-enrollment/activity-enrollment.enum';
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActivityEntity } from './activity.entity';
import { MemberEntity } from './member.entity';

@Entity({ name: 'activity_enrollments' })
export class ActivityEnrollmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  activity_id: number;

  @Column()
  member_id: number;

  @Column({ default: 0 })
  cumulative_csrtime: number;

  @Column({ default: 0 })
  receive_amount: number;

  @Column()
  status: ActivityEnrollmentStatus;

  @Column()
  enroll_time: Date;

  @Column()
  checkin_time: Date;

  @Column()
  checkout_time: Date;

  @Column()
  enrollment_time: Date;

  @Column()
  complete_time: Date;

  @Column()
  result_rating1: string;

  @Column()
  result_rating2: string;

  @Column()
  result_rating3: string;

  @Column()
  result_rating4: string;

  @Column()
  result_rating5: string;

  @Column({ default: false })
  is_notification_checkout: boolean;

  @Column()
  is_notification_start_event: boolean;

  @Column()
  image: string;

  @Column()
  noted: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToOne(() => ActivityEntity, (activity) => activity.enrollments)
  @JoinColumn({ name: 'activity_id' })
  activity: ActivityEntity;

  @ManyToOne(() => MemberEntity, (member) => member.enrollments)
  @JoinColumn({ name: 'member_id' })
  member: MemberEntity;
}
