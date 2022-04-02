import { ActivityEnrollmentStatus } from 'src/activity-enrollment/activity-enrollment.enum';
import { DocumentNumberService } from 'src/document-number/document-number.service';
import { TransactionService } from 'src/transaction/transaction.service';
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
  ) {}

  async distributionCoin() {
    const date = new Date();
    // const timestamp = +date + 14 * 60 * 60 * 1000;

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

          const dataTransfer = {
            address: process.env.walletAddress,
            receiver: activities[i].enrollments[j].member.wallet_address,
            coin: activities[i].receiver_token_type,
            amount: userCsrtime,
          };

          // TODO: create blockchain service
        }
      }
    }

    return { activities };
  }
}
