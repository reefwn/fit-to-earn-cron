import { ActivityEnrollmentService } from 'src/activity-enrollment/activity-enrollment.service';
import { ActivityEnrollmentStatus } from 'src/activity-enrollment/activity-enrollment.enum';
import { DocumentNumberService } from 'src/document-number/document-number.service';
import { MessagingPayload } from 'firebase-admin/lib/messaging/messaging-api';
import { MemberHealthService } from 'src/member-health/member-health.service';
import { NotificationService } from 'src/notification/notification.service';
import { CoinHistoryService } from 'src/coin-history/coin-history.service';
import {
  Between,
  FindManyOptions,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  Not,
} from 'typeorm';
import { TransactionService } from 'src/transaction/transaction.service';
import { BlockChainService } from 'src/blockchain/blockchain.service';
import { NotificationData } from 'src/notification/notification.dto';
import { GoogleFitService } from 'src/google-fit/google-fit.service';
import { TransactionEntity } from 'src/entities/transaction.entity';
import { BlockChainDataDto } from 'src/blockchain/blockchain.dto';
import { ActivityService } from 'src/activity/activity.service';
import { MemberService } from 'src/member/member.service';
import { CoinService } from 'src/coin/coin.service';
import { getWeekFromDate } from './utility';
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
import {
  GOOGLE_FIT_HEART_DATA_SOURCE,
  GOOGLE_FIT_HEART_DATA_TYPE,
  GOOGLE_FIT_HEART_USER_INPUT_DATA_SOURCE,
  GOOGLE_FIT_SLEEP_ACTIVITY_TYPE,
  GOOGLE_FIT_STEP_DATA_SOURCE,
  GOOGLE_FIT_STEP_DATA_TYPE,
  GOOGLE_FIT_STEP_USER_INPUT_DATA_SOURCE,
} from 'src/google-fit/google-fit.const';
import {
  MemberHealthStatus,
  MemberHealthType,
} from 'src/member-health/member-health.enum';
import { HealthConfigService } from 'src/health-config/health-config.service';
import { HealthConfigType } from 'src/health-config/health-config.enum';
import { MemberHealthEntity } from 'src/entities/member-health.entity';

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
    private memberService: MemberService,
    private googleFitService: GoogleFitService,
    private memberHealthService: MemberHealthService,
    private healthConfigService: HealthConfigService,
  ) {}

  async confirmTransaction() {
    const pendingTransactions = await this.transactionService.getTxId({
      tx_id: Not(IsNull()),
      status: TransactionStatus.PENDING,
      confirmation_times: LessThan(2),
    });

    for (let i = 0; i < pendingTransactions.length; i++) {
      let blockResponse;
      try {
        blockResponse = await this.blockChainService.getStatus(
          pendingTransactions[i].tx_id,
        );
      } catch (error) {
        continue;
      }

      const confirmationTimes = pendingTransactions[i].confirmation_times || 0;
      let status: TransactionStatus;
      if (blockResponse && blockResponse.result) {
        status = TransactionStatus.SUCCESS;
      } else {
        status =
          confirmationTimes >= 2
            ? TransactionStatus.FAIL
            : TransactionStatus.PENDING;
      }

      await this.transactionService.update(
        {
          tx_id: pendingTransactions[i].tx_id,
        },
        {
          status,
          confirmation_times: confirmationTimes + 1,
        },
      );
    }
  }

  async userNeedtoCheckout() {
    const date = new Date();
    const timestamp = +date;

    const activities = await this.activityService.find({
      relations: { enrollments: { member: true } },
      where: {
        status: ActivityStatus.APPROVE,
        deleted_at: IsNull(),
        req_checkout: Not(ActivityRequireCheckinCheckout.NO),
        enrollments: {
          status: ActivityEnrollmentStatus.CHECKIN,
          is_notification_checkout: false,
        },
      },
    });

    const filteredActivities = activities.filter((activity) => {
      const timeDiff = timestamp - +activity.start_checkout;
      const timeDiffInMinute = Math.round(timeDiff / 60000);
      return timeDiffInMinute <= 15;
    });

    for (let i = 0; i < filteredActivities.length; i++) {
      for (let j = 0; j < filteredActivities[i].enrollments.length; j++) {
        const memberTokenDevices = await this.userAppTokenService.find({
          where: { member_id: filteredActivities[i].enrollments[j].member_id },
          order: { created_at: 'DESC' },
          take: 5,
        });

        let notificationMessage: MessagingPayload;
        for (let k = 0; k < memberTokenDevices.length; k++) {
          const notificationData: NotificationData = {
            type: NotificationType.NOTIFY_BEFORE_CHECKOUT,
            registrationToken: memberTokenDevices[k].token,
            activityName: filteredActivities[i].title,
          };

          await this.activityEnrollmentService.update(
            {
              id: filteredActivities[i].enrollments[j].id,
            },
            { is_notification_checkout: true },
          );

          notificationMessage = await this.notificationService.notify(
            notificationData,
          );
        }

        const notificationEntity = this.notificationService.create({
          title: notificationMessage.notification.title,
          message: notificationMessage.notification.body,
          member_id: filteredActivities[i].enrollments[j].member_id,
          is_sent: 1,
          is_readed: 0,
          link_to: NotificationBodyLocKey.MY_EVENT,
          type: NotificationBodyLocKey.MY_EVENT,
        });
        await this.notificationService.save(notificationEntity);
      }
    }
  }

  async userNeedtoCheckin() {
    const date = new Date();
    const timestamp = +date;

    const activities = await this.activityService.find({
      relations: { enrollments: { member: true } },
      where: {
        status: ActivityStatus.APPROVE,
        deleted_at: IsNull(),
        req_checkin: Not(ActivityRequireCheckinCheckout.NO),
        enrollments: {
          status: ActivityEnrollmentStatus.REGISTER,
          is_notification_start_event: false,
        },
      },
    });

    const nextThreeDays = new Date(date.setDate(new Date(date).getDate() + 3))
      .toISOString()
      .split('T')[0];
    const filteredActivities = activities.filter((activity) => {
      const startCheckin = activity.start_date.toISOString().split('T')[0];
      return startCheckin === nextThreeDays;
    });

    for (let i = 0; i < filteredActivities.length; i++) {
      for (let j = 0; j < filteredActivities[i].enrollments.length; j++) {
        const memberTokenDevices = await this.userAppTokenService.find({
          where: { member_id: filteredActivities[i].enrollments[j].member_id },
          order: { created_at: 'DESC' },
          take: 5,
        });

        let notificationMessage: MessagingPayload;
        for (let k = 0; k < memberTokenDevices.length; k++) {
          const notificationData: NotificationData = {
            type: NotificationType.NOTIFY_BEFORE_EVENT_START,
            registrationToken: memberTokenDevices[k].token,
            activityName: filteredActivities[i].title,
          };

          await this.activityEnrollmentService.update(
            {
              id: filteredActivities[i].enrollments[j].id,
            },
            { is_notification_start_event: true },
          );

          notificationMessage = await this.notificationService.notify(
            notificationData,
          );
        }

        const notificationEntity = this.notificationService.create({
          title: notificationMessage.notification.title,
          message: notificationMessage.notification.body,
          member_id: filteredActivities[i].enrollments[j].member_id,
          is_sent: 1,
          is_readed: 0,
          link_to: NotificationBodyLocKey.MY_EVENT,
          type: NotificationBodyLocKey.MY_EVENT,
        });
        await this.notificationService.save(notificationEntity);
      }
    }
  }

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

  async crontapGetHealth(dateStr?: string) {
    const dateObj = dateStr ? new Date(dateStr) : new Date();
    const date = dateObj.getTime() + 7 * 60 * 60 * 1000;
    const newDate = new Date(date);

    newDate.setDate(new Date(date).getDate() - 1);
    const dd = String(newDate.getDate()).padStart(2, '0');
    const mm = String(newDate.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = newDate.getFullYear();

    const today = yyyy + '-' + mm + '-' + dd;

    const weekDates = getWeekFromDate(today);
    const startDate = +weekDates[0];
    const endDate = +weekDates[6];

    const heartBody = this.googleFitService.getBody(
      GOOGLE_FIT_HEART_DATA_TYPE,
      GOOGLE_FIT_HEART_DATA_SOURCE,
      startDate,
      endDate,
    );

    const heartUserInputBody = this.googleFitService.getBody(
      GOOGLE_FIT_HEART_DATA_TYPE,
      GOOGLE_FIT_HEART_USER_INPUT_DATA_SOURCE,
      startDate,
      endDate,
    );

    const stepBody = this.googleFitService.getBody(
      GOOGLE_FIT_STEP_DATA_TYPE,
      GOOGLE_FIT_STEP_DATA_SOURCE,
      startDate,
      endDate,
    );

    const stepUserInputBody = this.googleFitService.getBody(
      GOOGLE_FIT_STEP_DATA_TYPE,
      GOOGLE_FIT_STEP_USER_INPUT_DATA_SOURCE,
      startDate,
      endDate,
    );

    const sleepQuery = this.googleFitService.getQuery(
      GOOGLE_FIT_SLEEP_ACTIVITY_TYPE,
      startDate,
      endDate,
    );

    const members = await this.memberService.find({
      where: { google_oauth_token: Not(IsNull()), deleted_at: IsNull() },
    });
    for (let i = 0; i < members.length; i++) {
      const accessToken = await this.googleFitService.refreshGoogleToken(
        members[i].google_oauth_token,
      );
      if (!accessToken) {
        continue;
      }

      // heart
      const heartUserInputs = new Array(7).fill(0);
      let isHeartUserInputAuthorized = true;

      try {
        const heartUserInputResponse =
          await this.googleFitService.requestAggregate(
            accessToken,
            heartUserInputBody,
          );

        const heartArray = heartUserInputResponse.data?.bucket;
        if (heartArray) {
          let idx = 0;
          for (const datasets of heartArray) {
            for (const points of datasets.dataset) {
              for (const hearts of points.point) {
                const heart = this.googleFitService.findIntVal(hearts.value);
                heartUserInputs[idx] = heart.intVal || 0;
              }
            }
            idx++;
          }
        }
      } catch (e) {
        isHeartUserInputAuthorized = false;
      }

      const heartResponse = await this.googleFitService.requestAggregate(
        accessToken,
        heartBody,
      );

      if (heartResponse) {
        let totalPoint = 0;
        let idx = 0;
        for (let j = 0; j < heartResponse.length; j++) {
          for (const points of heartResponse[j].dataset) {
            for (const hearts of points.point) {
              const heart = this.googleFitService.findIntVal(hearts.value);
              const heartPointInt = heart.intVal || 0;
              const userHeartPoint = isHeartUserInputAuthorized
                ? heartPointInt - heartUserInputs[idx]
                : heartPointInt;

              totalPoint += userHeartPoint;

              const timeSync = new Date(
                `${weekDates[j].slice(0, 10)} 16:59:59 +00:00`,
              );

              const condition = {
                time_sync: timeSync,
                type: MemberHealthType.HEART,
                member_id: members[i].id,
              };
              const record = await this.memberHealthService.findOne({
                where: condition,
              });

              if (!record) {
                const memberHealthEntity = this.memberHealthService.create({
                  type: MemberHealthType.HEART,
                  point: userHeartPoint,
                  time_sync: timeSync,
                  member_id: members[i].id,
                  point_first_sync: userHeartPoint,
                  status: MemberHealthStatus.PENDING,
                  point_remain: totalPoint,
                });
                await this.memberHealthService.save(memberHealthEntity);
              }

              if (record && userHeartPoint > record.point) {
                await this.memberHealthService.update(condition, {
                  point: userHeartPoint,
                  point_remain: totalPoint,
                });
              }
              idx++;
            }
          }
        }
      }

      // step
      const stepUserInputs = new Array(7).fill(0);
      let isStepUserInputAuthorized = true;

      try {
        const stepUserInputResponse =
          await this.googleFitService.requestAggregate(
            accessToken,
            stepUserInputBody,
          );

        const stepArray = stepUserInputResponse.data?.bucket;
        if (stepArray) {
          let idx = 0;
          for (const datasets of stepArray) {
            for (const points of datasets.dataset) {
              for (const steps of points.point) {
                const step = this.googleFitService.findIntVal(steps.value);
                heartUserInputs[idx] = step.intVal || 0;
              }
            }
            idx++;
          }
        }
      } catch (e) {
        isStepUserInputAuthorized = false;
      }

      const stepResponse = await this.googleFitService.requestAggregate(
        accessToken,
        stepBody,
      );

      if (stepResponse) {
        let totalPoint = 0;
        let idx = 0;
        for (let j = 0; j < stepResponse.length; j++) {
          for (const points of stepResponse[j].dataset) {
            for (const steps of points.point) {
              const step = this.googleFitService.findIntVal(steps.value);

              const stepPointInt = step.intVal || 0;
              const userStepPoint = isStepUserInputAuthorized
                ? stepPointInt - stepUserInputs[idx]
                : stepPointInt;

              totalPoint += userStepPoint;

              const timeSync = new Date(
                `${weekDates[j].slice(0, 10)} 16:59:59 +00:00`,
              );

              const condition = {
                time_sync: timeSync,
                type: MemberHealthType.STEP,
                member_id: members[i].id,
              };
              const record = await this.memberHealthService.findOne({
                where: condition,
              });

              if (!record) {
                const memberHealthEntity = this.memberHealthService.create({
                  type: MemberHealthType.STEP,
                  point: userStepPoint,
                  time_sync: timeSync,
                  member_id: members[i].id,
                  point_first_sync: userStepPoint,
                  status: MemberHealthStatus.PENDING,
                  point_remain: totalPoint,
                });
                await this.memberHealthService.save(memberHealthEntity);
              }

              if (record && userStepPoint > record.point) {
                await this.memberHealthService.update(condition, {
                  point: userStepPoint,
                  point_remain: totalPoint,
                });
              }
              idx++;
            }
          }
        }
      }

      // sleep
      const sleepResponse = await this.googleFitService.requestSession(
        accessToken,
        sleepQuery,
      );

      if (sleepResponse) {
        for (let j = 0; j < sleepResponse.length; j++) {
          const difTime =
            sleepResponse[j].endTimeMillis - sleepResponse[j].startTimeMillis;
          const hoursSleep = Math.floor(difTime / 60 / 60 / 1000);
          if (hoursSleep === 0) {
            continue;
          }

          const timeSync = new Date(
            `${weekDates[j].slice(0, 10)} 16:59:59 +00:00`,
          );

          const condition = {
            time_sync: timeSync,
            type: MemberHealthType.SLEEP,
            member_id: members[i].id,
          };
          const record = await this.memberHealthService.findOne({
            where: condition,
          });

          if (!record) {
            const memberHealthEntity = this.memberHealthService.create({
              type: MemberHealthType.STEP,
              point: hoursSleep,
              time_sync: timeSync,
              member_id: members[i].id,
              point_first_sync: hoursSleep,
              status: MemberHealthStatus.PENDING,
            });
            await this.memberHealthService.save(memberHealthEntity);
          }

          if (record && hoursSleep > record.point) {
            await this.memberHealthService.update(condition, {
              point: hoursSleep,
            });
          }
        }
      }
    }
  }

  async distributeFitivityAccumulation(dateStr?: string, memberId?: number) {
    const dateObj = dateStr ? new Date(dateStr) : new Date();
    const date = dateObj.getTime() + 7 * 60 * 60 * 1000;
    const newDate = new Date(date);

    newDate.setDate(new Date(date).getDate() - 1);
    const dd = String(newDate.getDate()).padStart(2, '0');
    const mm = String(newDate.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = newDate.getFullYear();

    const today = yyyy + '-' + mm + '-' + dd;

    const weekDates = getWeekFromDate(today);
    const startDate = weekDates[0];
    const endDate = `${weekDates[6].slice(0, 10)} 23:59:59`;

    const healthConfigs = await this.healthConfigService.find({});
    const healthConfigStep = healthConfigs.find(
      (x) => x.type === HealthConfigType.STEP,
    );
    const healthConfigHeart = healthConfigs.find(
      (x) => x.type === HealthConfigType.HEART,
    );
    const healthConfigSleep = healthConfigs.find(
      (x) => x.type === HealthConfigType.SLEEP,
    );

    const condition: FindManyOptions<MemberHealthEntity> = {
      relations: { member: true },
      where: {
        time_sync: Between(startDate, endDate),
      },
      order: { time_sync: 'ASC' },
    };
    if (memberId) {
      condition.where = { ...condition, member_id: memberId };
    }

    const fitivityData = await this.memberHealthService.find(condition);

    const submitToBlockData = [];
    for (const fitivity of fitivityData) {
      const currDate = `${fitivity.time_sync.getDate()}`.padStart(2, '0');
      const currMonth = `${fitivity.time_sync.getMonth() + 1}`.padStart(2, '0');
      const currYear = `${fitivity.time_sync.getFullYear()}`;
      const currentDate = `${currYear}-${currMonth}-${currDate}`;

      if (currentDate === today) {
        const relatedHistory = fitivityData.filter(
          (fit) =>
            fit.member_id === fitivity.member_id && fit.type === fitivity.type,
        );

        // sum point for accum
        const totalPoints = relatedHistory.reduce((a, b) => {
          return a + (+b.point || 0);
        }, 0);

        // sum coin distribute
        const totalAmountReceived = relatedHistory.reduce((a, b) => {
          return a + (+b.amount_receive || 0);
        }, 0);

        let amountPerCoin = 1;
        let coinAmountPerWeek = 1;
        if (fitivity.type === MemberHealthType.HEART) {
          amountPerCoin = healthConfigHeart.amount_per_coin;
          coinAmountPerWeek = healthConfigHeart.coin_amount_per_week;
        }
        if (fitivity.type === MemberHealthType.STEP) {
          amountPerCoin = healthConfigStep.amount_per_coin;
          coinAmountPerWeek = healthConfigStep.coin_amount_per_week;
        }
        if (fitivity.type === MemberHealthType.SLEEP) {
          amountPerCoin = healthConfigSleep.amount_per_coin;
          coinAmountPerWeek = healthConfigSleep.coin_amount_per_week;
        }

        const toDistribute = totalPoints / amountPerCoin;
        const canDistribute = coinAmountPerWeek - totalAmountReceived;
        let finalCoinDistribute =
          toDistribute - totalAmountReceived >= canDistribute
            ? canDistribute
            : toDistribute - totalAmountReceived;

        if (finalCoinDistribute < 0) {
          finalCoinDistribute = 0;
        }

        const data = {
          member_wallet: fitivity.member.wallet_address,
          coin_distribute: finalCoinDistribute,
          receiver_name: `${fitivity.member.first_name} ${fitivity.member.last_name}`,
          member_id: fitivity.member.id,
          coin_use: finalCoinDistribute,
          updata_id: fitivity.id,
        };

        if (+data.coin_distribute > 0) {
          submitToBlockData.push(data);
        } else {
          // TODO: add distributeTransfer function
          // await distributeTranfer(data);
        }
      }
    }
  }
}
