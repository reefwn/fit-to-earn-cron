import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'document_numbers' })
export class DocumentNumberEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  current_year: string;

  @Column()
  current_month: string;

  @Column()
  running_number: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
