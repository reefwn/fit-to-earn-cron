import { ActivityEnrollmentService } from 'src/activity-enrollment/activity-enrollment.service';
import { ActivityEnrollmentStatus } from 'src/activity-enrollment/activity-enrollment.enum';
import { DocumentNumberService } from 'src/document-number/document-number.service';
import { MessagingPayload } from 'firebase-admin/lib/messaging/messaging-api';
import { NotificationService } from 'src/notification/notification.service';
import { CoinHistoryService } from 'src/coin-history/coin-history.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { BlockChainService } from 'src/blockchain/blockchain.service';
import { NotificationData } from 'src/notification/notification.dto';
import { TransactionEntity } from 'src/entities/transaction.entity';
import { BlockChainDataDto } from 'src/blockchain/blockchain.dto';
import { ActivityService } from 'src/activity/activity.service';
import { LessThan, LessThanOrEqual, MoreThan } from 'typeorm';
import { CoinService } from 'src/coin/coin.service';
import {
  ActivityStatus,
  ActivityRequireCheckinCheckout,
} from 'src/activity/activity.enum';
import { Injectable } from '@nestjs/common';
import {
  TransactionStatus,
  TransactionType,
} from 'src/transaction/transaction.enum';
import { UserAppTokenService } from 'src/user-app-token/user-app-token.service';
import {
  NotificationBodyLocKey,
  NotificationType,
} from 'src/notification/notification.enum';

@Injectable()
export class TaskService {
  constructor(
    private activityService: ActivityService,
    private documentNumberService: DocumentNumberService,
    private transactionService: TransactionService,
    private blockChainService: BlockChainService,
    private coinHistoryService: CoinHistoryService,
    private activityEnrollmentService: ActivityEnrollmentService,
    private userAppTokenService: UserAppTokenService,
    private notificationService: NotificationService,
    private coinService: CoinService,
  ) {}

  async distributionCoin() {
    const date = new Date();
    const timestamp = +date + 14 * 60 * 60 * 1000;

    const activityBaseQuery = { status: ActivityStatus.APPROVE };
    const enrollmentBaseQuery = { member: true };
    const enrollmentQuery = [
      { ...enrollmentBaseQuery, status: ActivityEnrollmentStatus.CHECKOUT },
      { ...enrollmentBaseQuery, status: ActivityEnrollmentStatus.COMPLETE },
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

          const transactionBaseEntity: Partial<TransactionEntity> = {
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

            const memberTokenDevices = await this.userAppTokenService.find({
              where: { member_id: activities[i].enrollments[j].member_id },
              order: { created_at: 'DESC' },
              take: 5,
            });

            let notificationMessage: MessagingPayload;
            for (let k = 0; k < memberTokenDevices.length; k++) {
              const notificationData: NotificationData = {
                type: NotificationType.RECEIVE_COIN,
                registrationToken: memberTokenDevices[k].token,
                coinName: activities[i].reciever_token.full_name,
                coinAmount: userCsrtime,
                userSend: activities[i].title,
              };

              notificationMessage = await this.notificationService.notify(
                notificationData,
              );
            }

            const notificationEntity = this.notificationService.create({
              title: notificationMessage.notification.title,
              message: notificationMessage.notification.body,
              member_id: activities[i].enrollments[j].member_id,
              is_sent: 1,
              is_readed: 0,
              link_to: NotificationBodyLocKey.TRANSACTION_HISTORY,
              type: NotificationBodyLocKey.TRANSACTION_HISTORY,
              image_ref_id: activities[i].reciever_token.id,
            });
            await this.notificationService.save(notificationEntity);
          }
        } else {
          await this.activityEnrollmentService.update(
            {
              id: activities[i].enrollments[j].id,
            },
            {
              status: ActivityEnrollmentStatus.DISTRIBUTED,
              receive_amount: 0,
            },
          );
        }
      }
    }
  }

  async crontabCancel() {
    const date = new Date();
    const timestamp = +date + 14 * 60 * 60 * 1000;

    const activityBaseQuery = { status: ActivityStatus.APPROVE };
    const enrollmentBaseQuery = { member: true };
    const enrollmentQuery = [
      { ...enrollmentBaseQuery, status: ActivityEnrollmentStatus.REGISTER },
      { ...enrollmentBaseQuery, status: ActivityEnrollmentStatus.CHECKIN },
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

    for (let i = 0; i < activities.length; i++) {
      for (let j = 0; j < activities[i].enrollments.length; j++) {
        let penaltyCase: number;
        switch (activities[i].enrollments[j].status) {
          case ActivityEnrollmentStatus.REGISTER:
            penaltyCase = 2;
            break;
          case ActivityEnrollmentStatus.REGISTER:
            penaltyCase = 3;
            break;
        }

        const senderWallet = activities[i].enrollments[j].member.wallet_address;
        const amountCanUse = [];
        let index = 0;
        let sumCoin = 0;

        const coinHistoryMember = await this.coinHistoryService.find({
          where: {
            member_id: activities[i].enrollments[j].member_id,
            expired_date: MoreThan(date),
          },
          order: { expired_date: 'ASC' },
        });

        let penaltyAmount = +activities[i][`penalty${penaltyCase}_amount`];
        const penaltyCoinId = +activities[i][`penalty${penaltyCase}_coin_id`];

        for (let k = 0; k < coinHistoryMember.length; k++) {
          if (
            Math.fround(coinHistoryMember[k].usege_amount) <
            Math.fround(coinHistoryMember[k].receive_amount)
          ) {
            const useAmount = coinHistoryMember[k].usege_amount || 0;
            amountCanUse[index] = {
              id: coinHistoryMember[k].id,
              old_amount: useAmount,
              receive_amount: coinHistoryMember[k].receive_amount,
              amount: coinHistoryMember[k].receive_amount - useAmount,
            };

            if (coinHistoryMember[k].coin_id === penaltyCoinId) {
              sumCoin += amountCanUse[index].amount;
            }
            index++;
          }
        }

        const amountTransfer = sumCoin - penaltyAmount;
        if (sumCoin > 0) {
          if (amountTransfer <= 0) {
            penaltyAmount = sumCoin;
          }

          const transactionNo = await this.documentNumberService.getRunNo();
          const sendTransactionEntity = this.transactionService.create({
            sender_name: `${activities[i].enrollments[j].member.first_name} ${activities[i].enrollments[j].member.last_name}`,
            receiver_name: null,
            wallet_sender: senderWallet,
            wallet_receiver: process.env.WALLET_ADDRESS,
            transaction_no: `CTF${transactionNo}`,
            type: TransactionType.SEND,
            status: TransactionStatus.PENDING,
            amount: penaltyAmount,
            amount_receive: penaltyAmount,
            coin_id: penaltyCoinId,
            coin_receive_id: penaltyCoinId,
            pair_transaction: `${transactionNo}`,
            note: `Penalty from event ${activities[i].title}`,
          });
          const sendTransaction = await this.transactionService.save(
            sendTransactionEntity,
          );

          const responseCoinData = await this.coinService.findOne({
            where: {
              id: penaltyCoinId,
            },
          });

          if (!responseCoinData) {
            continue;
          }

          const dataTransfer: BlockChainDataDto = {
            address: senderWallet,
            password: activities[i].enrollments[j].member.decrypt_key,
            receiver: process.env.ADMIN_ADDRESS,
            coin: responseCoinData.name,
            amount: penaltyAmount,
          };

          if (penaltyAmount > 0 && sumCoin > 0) {
            const blockResponse = await this.blockChainService.transferCoin(
              dataTransfer,
            );
            if (blockResponse.status === 200) {
              sendTransaction.status = TransactionStatus.SUCCESS;
              sendTransaction.tx_id = blockResponse.hash;
            } else {
              sendTransaction.status = TransactionStatus.FAIL;
            }
            await this.transactionService.save(sendTransaction);

            let amountRedeem = penaltyAmount;
            for (let l = 0; l < amountCanUse.length; l++) {
              if (amountRedeem > 0) {
                let redeemCoin: number;
                if (
                  Math.fround(amountCanUse[l].amount) >
                  Math.fround(amountRedeem)
                ) {
                  if (amountRedeem > amountCanUse[l].amount) {
                    amountRedeem = amountCanUse[l].amount - amountRedeem;
                  }
                  redeemCoin = +amountCanUse[l].old_amount + +amountRedeem;
                  await this.coinHistoryService.update(
                    { id: amountCanUse[l].id },
                    { usege_amount: redeemCoin },
                  );
                } else {
                  redeemCoin =
                    +amountCanUse[l].old_amount + +amountCanUse[l].amount;
                  await this.coinHistoryService.update(
                    { id: amountCanUse[l].id },
                    { usege_amount: redeemCoin },
                  );
                  amountRedeem -= amountCanUse[l].amount;
                }
              }
            }
          }
        }

        await this.activityEnrollmentService.update(
          {
            id: activities[i].enrollments[j].id,
          },
          { status: ActivityEnrollmentStatus.CANCEL },
        );
      }
    }
  }

  async expireCoin() {
    const date = new Date();
    const timestamp = +date + 7 * 60 * 60 * 1000;
    const dateNow = new Date(timestamp);

    const baseQuery = { expired_date: LessThanOrEqual(dateNow) };
    const expireCoinHistory = await this.coinHistoryService.find({
      relations: { member: true, coin: true },
      where: [
        { ...baseQuery, expired_amount: 0 },
        { ...baseQuery, expired_amount: null },
      ],
    });

    for (let i = 0; i < expireCoinHistory.length; i++) {
      const transactionNo = await this.documentNumberService.getRunNo();
      const amount_expire =
        expireCoinHistory[i].receive_amount - expireCoinHistory[i].usege_amount;
      if (amount_expire > 0) {
        const expireTransactionEntity = this.transactionService.create({
          sender_name: `${expireCoinHistory[i].member.first_name} ${expireCoinHistory[i].member.last_name}`,
          wallet_sender: `${expireCoinHistory[i].member.wallet_address}`,
          wallet_receiver: process.env.WALLET_ADDRESS,
          transaction_no: `CTF${transactionNo}`,
          type: TransactionType.SEND,
          status: TransactionStatus.PENDING,
          amount: amount_expire,
          coin_id: expireCoinHistory[i].coin_id,
          fee: 1,
          note: 'Coin Expired',
        });
        const expireTransaction = await this.transactionService.save(
          expireTransactionEntity,
        );

        const dataTransfer: BlockChainDataDto = {
          address: expireCoinHistory[i].member.wallet_address,
          password: expireCoinHistory[i].member.decrypt_key,
          receiver: process.env.ADMIN_ADDRESS,
          coin: expireCoinHistory[i].coin.name,
          amount: amount_expire,
        };

        const blockResponse = await this.blockChainService.transferCoin(
          dataTransfer,
        );
        if (blockResponse.status === 200) {
          await this.coinHistoryService.update(
            { id: expireCoinHistory[i].id },
            { expired_amount: amount_expire },
          );

          expireTransaction.status = TransactionStatus.SUCCESS;
          expireTransaction.tx_id = blockResponse.hash;
        } else {
          expireTransaction.status = TransactionStatus.FAIL;
        }
        await this.transactionService.save(expireTransaction);
      }
    }
  }
}
