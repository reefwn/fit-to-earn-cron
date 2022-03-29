import { MemberGender } from 'src/member/member.enum';
import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'members' })
export class MemberEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employee_code: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  nickname: string;

  @Column()
  citizen_id: string;

  @Column()
  gender: MemberGender;

  @Column({ type: 'date' })
  birthdate: Date;

  @Column()
  department: string;

  @Column()
  total_csrtime: number;

  @Column()
  wallet_address: string;

  @Column()
  decrypt_key: string;

  @Column()
  email: string;

  @Column()
  verify_email: string;

  @Column()
  password: string;

  @Column()
  phone_number: string;

  @Column()
  otp_refcode: string;

  @Column()
  profile_image: string;

  @Column()
  google_oauth_token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}