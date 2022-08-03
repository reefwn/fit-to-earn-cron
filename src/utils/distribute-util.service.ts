import { Injectable } from '@nestjs/common';
import { MessagingPayload } from 'firebase-admin/lib/messaging/messaging-api';
import { BlockChainDataDto } from 'src/blockchain/blockchain.dto';
import { BlockChainService } from 'src/blockchain/blockchain.service';
import { CoinHistoryService } from 'src/coin-history/coin-history.service';
import { CoinName } from 'src/coin/coin.enum';
import { CoinService } from 'src/coin/coin.service';
import { MemberHealthStatus } from 'src/member-health/member-health.enum';
import { MemberHealthService } from 'src/member-health/member-health.service';
import { NotificationData } from 'src/notification/notification.dto';
import {
  NotificationBodyLocKey,
  NotificationType,
} from 'src/notification/notification.enum';
import { NotificationService } from 'src/notification/notification.service';
import { sleep } from 'src/task/utility';
import { TransactionStatus } from 'src/transaction/transaction.enum';
import { TransactionService } from 'src/transaction/transaction.service';
import { UserAppTokenService } from 'src/user-app-token/user-app-token.service';
import { distributeTransferDto } from './distribute-util.dto';
import { TransactionUtilService } from './transaction-util.service';

@Injectable()
export class DistributeUtilService {
  constructor(
    private coinService: CoinService,
    private coinHistoryService: CoinHistoryService,
    private blockChainService: BlockChainService,
    private transactionService: TransactionService,
    private memberHealthService: MemberHealthService,
    private userAppTokenService: UserAppTokenService,
    private notificationService: NotificationService,
    // utility services
    private transactionUtilService: TransactionUtilService,
  ) {}

  async distributeTransferFitivityAccumulation(data: distributeTransferDto) {
    const timestamp = +new Date() + 7 * 60 * 60 * 1000;
    const coin = await this.coinService.findByName(CoinName.Y);

    // save transaction to database
    const transactionBaseEntity = this.transactionUtilService.getBaseEntity();
    transactionBaseEntity.receiver_name = data.receiverName;
    transactionBaseEntity.amount = data.distributeAmount;
    transactionBaseEntity.amount_receive = data.distributeAmount;
    transactionBaseEntity.coin_id = coin.id;
    transactionBaseEntity.coin_receive_id = coin.id;
    transactionBaseEntity.note = 'Fitivity';

    const [sendTransaction, receiveTransaction] =
      await this.transactionUtilService.createAndSavePairTransactions(
        transactionBaseEntity,
      );

    // save transaction to blockchain
    const dataTransfer: BlockChainDataDto = {
      address: process.env.walletAddress,
      receiver: data.memberWalletAddress,
      coin: coin.name,
      amount: data.distributeAmount,
    };

    let limitTry = 0;
    let blockResponse;
    while (limitTry < 5) {
      blockResponse = await this.blockChainService.tranferCoinFromAdmin(
        dataTransfer,
      );

      if (
        blockResponse &&
        blockResponse.status === 200 &&
        blockResponse.data &&
        blockResponse.data.message !== 'Not enough eth'
      ) {
        console.log(
          `get expected response from blockchain with number of tries = ${limitTry}, at: ${
            new Date().toTimeString().split(' ')[0]
          }`,
        );
        break;
      }

      await sleep(1000);
      limitTry += 1;
    }

    if (
      !blockResponse ||
      blockResponse.status !== 200 ||
      !blockResponse.data ||
      blockResponse.data.message === 'Not enough eth'
    ) {
      await this.transactionService.updateStatusByPairTx(
        sendTransaction.pair_transaction,
        TransactionStatus.FAIL,
      );
    } else {
      await this.transactionService.updateStatusByPairTx(
        sendTransaction.pair_transaction,
        TransactionStatus.SUCCESS,
        { tx_id: blockResponse.data.id },
      );

      const expireCoinHistory =
        coin.age !== 0 ? timestamp + coin.age * 24 * 60 * 60 * 1000 : null;
      const coinHistoryEntity = this.coinHistoryService.create({
        wallet_address: data.memberWalletAddress,
        coin_id: coin.id,
        receive_date: new Date(timestamp),
        expired_date: new Date(expireCoinHistory),
        member_id: data.memberId,
        receive_amount: data.distributeAmount,
      });
      await this.coinHistoryService.save(coinHistoryEntity);

      await this.memberHealthService.update(
        { id: data.updateId },
        {
          amount_receive: data.distributeAmount,
          point_use: data.distributeAmount,
          status: MemberHealthStatus.DISTRIBUTED,
        },
      );

      const memberTokenDevices = await this.userAppTokenService.findByMemberId(
        data.memberId,
      );

      let notificationMessage: MessagingPayload;
      for (let k = 0; k < memberTokenDevices.length; k++) {
        const notificationData: NotificationData = {
          type: NotificationType.RECEIVE_COIN,
          registrationToken: memberTokenDevices[k].token,
          coinName: coin.full_name,
          coinAmount: data.distributeAmount,
          userSend: process.env.ADMIN_USER,
        };

        notificationMessage = await this.notificationService.notify(
          notificationData,
        );
      }

      const notificationEntity = this.notificationService.create({
        title: notificationMessage.notification.title,
        message: notificationMessage.notification.body,
        member_id: data.memberId,
        is_sent: 1,
        is_readed: 0,
        link_to: NotificationBodyLocKey.TRANSACTION_HISTORY,
        type: NotificationBodyLocKey.TRANSACTION_HISTORY,
        image_ref_id: data.coin.id,
      });
      await this.notificationService.save(notificationEntity);
    }
  }
}
