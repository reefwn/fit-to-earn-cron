import { TransactionEntity } from 'src/entities/transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
  ) {}

  create(entity: Partial<TransactionEntity>): TransactionEntity {
    return this.transactionRepo.create(entity);
  }

  save(entity: TransactionEntity): Promise<TransactionEntity> {
    return this.transactionRepo.save(entity);
  }
}
