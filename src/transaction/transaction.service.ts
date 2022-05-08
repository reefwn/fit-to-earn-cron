import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { TransactionEntity } from 'src/entities/transaction.entity';
import { TransactionStatus } from './transaction.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
  ) {}

  find(options: FindManyOptions<TransactionEntity>) {
    return this.transactionRepo.find(options);
  }

  create(entity: Partial<TransactionEntity>): TransactionEntity {
    return this.transactionRepo.create(entity);
  }

  save(entity: TransactionEntity): Promise<TransactionEntity> {
    return this.transactionRepo.save(entity);
  }

  update(
    criteria: FindOptionsWhere<TransactionEntity>,
    options: QueryDeepPartialEntity<TransactionEntity>,
  ) {
    options.updated_at = new Date();
    return this.transactionRepo.update(criteria, options);
  }

  getTxId(options: FindOptionsWhere<TransactionEntity>) {
    const alias = 'transaction';
    const txId = 'transaction.tx_id';

    return this.transactionRepo
      .createQueryBuilder(alias)
      .select(txId)
      .where(options)
      .groupBy(txId)
      .getMany();
  }

  updateStatusByPairTx(
    pairTx: string,
    status: TransactionStatus,
    extraOptions?: QueryDeepPartialEntity<TransactionEntity>,
  ) {
    const baseOptions = { status, updated_at: new Date() };
    const options = extraOptions
      ? Object.assign(baseOptions, extraOptions)
      : baseOptions;

    return this.transactionRepo.update({ pair_transaction: pairTx }, options);
  }
}
