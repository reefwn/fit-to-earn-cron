import { ActivityEnrollmentService } from 'src/activity-enrollment/activity-enrollment.service';
import { ActivityEnrollmentStatus } from 'src/activity-enrollment/activity-enrollment.enum';
import { DocumentNumberService } from 'src/document-number/document-number.service';
import { CoinHistoryService } from 'src/coin-history/coin-history.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { BlockChainService } from 'src/blockchain/blockchain.service';
import { BlockChainDataDto } from 'src/blockchain/blockchain.dto';
import { ActivityService } from 'src/activity/activity.service';
import { LessThan } from 'typeorm';
import {
  ActivityStatus,
  ActivityRequireCheckinCheckout,
} from 'src/activity/activity.enum';
import { Injectable } from '@nestjs/common';
import {
  TransactionStatus,
  TransactionType,
} from 'src/transaction/transaction.enum';

@Injectable()
export class TaskService {
  constructor(
    private activityService: ActivityService,
    private documentNumberService: DocumentNumberService,
    private transactionService: TransactionService,
    private blockChainService: BlockChainService,
    private coinHistoryService: CoinHistoryService,
    private activityEnrollmentService: ActivityEnrollmentService,
  ) {}

  async distributionCoin() {
    const date = new Date();
    const timestamp = +date + 14 * 60 * 60 * 1000;

    const activityBaseQuery = { status: ActivityStatus.APPROVE };
    const enrollmentBaseQuery = { member: true };
    const enrollmentQuery = [
      { ...enrollmentBaseQuery, status: ActivityEnrollmentStatus.CHECKIN },
      { ...enrollmentBaseQuery, status: ActivityEnrollmentStatus.CHECKOUT },
    ];

    const activities = await this.activityService.find({
      relations: { reciever_token: true, enrollments: { member: true } },
      where: [
        {
          ...activityBaseQuery,
          req_checkin: ActivityRequireCheckinCheckout.NO,
          end_date: LessThan(date),
          enrollments: enrollmentQuery,
        },
        {
          ...activityBaseQuery,
          req_checkout: ActivityRequireCheckinCheckout.NO,
          final_checkout: LessThan(date),
          enrollments: enrollmentQuery,
        },
      ],
    });

    // TODO : loop through enrollment and calculate coin
    for (let i = 0; i < activities.length; i++) {
      for (let j = 0; j < activities[i].enrollments.length; j++) {
        const memberCsrTime =
          activities[i].enrollments[j].cumulative_csrtime || 0;

        if (+memberCsrTime >= +activities[i].minimum_csrtime) {
          const totalCoinDistributed = activities[i].amount_giveaways;
          let timeCSRUser =
            memberCsrTime >= activities[i].cumulative_minute
              ? memberCsrTime
              : activities[i].cumulative_minute;

          if (timeCSRUser === 0) {
            timeCSRUser = 1;
          }
          if (memberCsrTime === 0 && activities[i].minimum_csrtime === 0) {
            timeCSRUser = activities[i].cumulative_minute;
          }

          let userCsrtime =
            ((timeCSRUser / activities[i].cumulative_minute) *
              (100 * totalCoinDistributed)) /
            100;
          if (+userCsrtime === 0) {
            userCsrtime =
              activities[i].minimum_csrtime === 0
                ? activities[i].amount_giveaways
                : 1;
          }

          const transactionBaseEntity = {
            sender_name: null,
            receiver_name: `${activities[i].enrollments[j].member.first_name} ${activities[i].enrollments[j].member.last_name}`,
            wallet_sender: process.env.WALLET_ADDRESS,
            wallet_receiver: `${activities[i].enrollments[j].member.wallet_address}`,
            status: TransactionStatus.PENDING,
            amount: userCsrtime,
            amount_receive: userCsrtime,
            coin_id: activities[i].reciever_token.id,
            coin_receive_id: activities[i].reciever_token.id,
            fee: 1,
            note: `คุณได้รับเหรียญ ${activities[i].reciever_token.full_name} จำนวน ${userCsrtime} เหรียญ จากกิจกรรม ${activities[i].title}`,
          };

          let transactionNo = await this.documentNumberService.getRunNo();
          const distributeSendTransactionEntity =
            this.transactionService.create(transactionBaseEntity);
          distributeSendTransactionEntity.type = TransactionType.SEND;
          distributeSendTransactionEntity.transaction_no = `CTF${transactionNo}`;
          distributeSendTransactionEntity.pair_transaction = `${transactionNo}`;
          const distributeSendTransaction = await this.transactionService.save(
            distributeSendTransactionEntity,
          );

          transactionNo = await this.documentNumberService.getRunNo();
          const distributeReceiveTransactionEntity =
            this.transactionService.create(transactionBaseEntity);
          distributeReceiveTransactionEntity.type = TransactionType.RECEIVE;
          distributeReceiveTransactionEntity.transaction_no = `CTF${transactionNo}`;
          distributeReceiveTransactionEntity.pair_transaction =
            distributeSendTransaction.pair_transaction;
          const distributeReceiveTransaction =
            await this.transactionService.save(
              distributeReceiveTransactionEntity,
            );

          const dataTransfer: BlockChainDataDto = {
            address: process.env.walletAddress,
            receiver: activities[i].enrollments[j].member.wallet_address,
            coin: activities[i].receiver_token_type,
            amount: userCsrtime,
          };

          // TODO: create blockchain service
          const blockResponse =
            await this.blockChainService.tranferCoinFromAdmin(dataTransfer);

          if (blockResponse.status !== 200) {
            distributeSendTransaction.status = TransactionStatus.FAIL;
            await this.transactionService.save(distributeSendTransaction);

            distributeReceiveTransaction.status = TransactionStatus.FAIL;
            await this.transactionService.save(distributeReceiveTransaction);
          } else {
            distributeSendTransaction.status = TransactionStatus.SUCCESS;
            distributeSendTransaction.tx_id = blockResponse.hash;
            await this.transactionService.save(distributeSendTransaction);

            distributeReceiveTransaction.status = TransactionStatus.SUCCESS;
            distributeReceiveTransaction.tx_id = blockResponse.hash;
            await this.transactionService.save(distributeReceiveTransaction);

            // TODO: create coin history service
            let expireCoinHistory = null;
            if (activities[i].reciever_token.age !== 0) {
              expireCoinHistory =
                timestamp +
                activities[i].reciever_token.age * 24 * 60 * 60 * 1000;
            }

            const coinHistoryEntity = this.coinHistoryService.create({
              wallet_address:
                activities[i].enrollments[j].member.wallet_address,
              coin_id: activities[i].reciever_token.id,
              receive_date: new Date(timestamp),
              expired_date: expireCoinHistory,
              member_id: activities[i].enrollments[j].member.id,
              receive_amount: userCsrtime,
            });
            await this.coinHistoryService.save(coinHistoryEntity);

            await this.activityEnrollmentService.update(
              {
                id: activities[i].enrollments[j].id,
              },
              {
                status: ActivityEnrollmentStatus.DISTRIBUTED,
                receive_amount: userCsrtime,
              },
            );

            // TODO: create notification service
          }
        }
      }
    }

    return { activities };
  }
}
