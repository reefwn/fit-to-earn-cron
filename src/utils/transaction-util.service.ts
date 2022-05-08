import { DocumentNumberService } from 'src/document-number/document-number.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { TransactionEntity } from 'src/entities/transaction.entity';
import { Injectable } from '@nestjs/common';
import {
  TransactionStatus,
  TransactionType,
} from 'src/transaction/transaction.enum';

@Injectable()
export class TransactionUtilService {
  constructor(
    private transactionService: TransactionService,
    private documentNumberService: DocumentNumberService,
  ) {}

  getBaseEntity(): Partial<TransactionEntity> {
    return {
      sender_name: null,
      wallet_sender: process.env.WALLET_ADDRESS,
      status: TransactionStatus.PENDING,
      fee: 1,
    };
  }

  async createAndSavePairTransactions(
    partialEntity: Partial<TransactionEntity>,
  ) {
    let transactionNo = await this.documentNumberService.getRunNo();
    const sendTransactionEntity = this.transactionService.create(partialEntity);
    sendTransactionEntity.type = TransactionType.SEND;
    sendTransactionEntity.transaction_no = `CTF${transactionNo}`;
    sendTransactionEntity.pair_transaction = `${transactionNo}`;

    transactionNo = await this.documentNumberService.getRunNo();
    const receiveTransactionEntity =
      this.transactionService.create(partialEntity);
    receiveTransactionEntity.type = TransactionType.RECEIVE;
    receiveTransactionEntity.transaction_no = `CTF${transactionNo}`;
    receiveTransactionEntity.pair_transaction =
      sendTransactionEntity.pair_transaction;

    const sendTransaction = await this.transactionService.save(
      sendTransactionEntity,
    );
    const receiveTransaction = await this.transactionService.save(
      receiveTransactionEntity,
    );

    return [sendTransaction, receiveTransaction];
  }
}
