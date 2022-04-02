import {
  TransactionStatus,
  TransactionType,
} from 'src/transaction/transaction.enum';
import {
  Entity,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'transactions' })
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sender_name: string;

  @Column()
  receiver_name: string;

  @Column()
  wallet_sender: string;

  @Column()
  wallet_receiver: string;

  @Column()
  transaction_no: string;

  @Column()
  pair_transaction: string;

  @Column()
  note: string;

  @Column()
  tx_id: string;

  @Column()
  coin_id: number;

  @Column()
  coin_receive_id: number;

  @Column()
  confirmation_times: number;

  @Column()
  status: TransactionStatus;

  @Column()
  type: TransactionType;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount_receive: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  fee: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
