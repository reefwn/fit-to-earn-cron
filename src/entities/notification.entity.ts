import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column()
  timestamp: Date;

  @Column()
  member_id: number;

  @Column()
  is_sent: number;

  @Column()
  is_readed: number;

  @Column()
  link_to: string;

  @Column()
  type: string;

  @Column()
  image_ref_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
