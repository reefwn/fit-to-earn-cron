import { CoinEntity } from 'src/entities/coin.entity';

export class distributeTransferDto {
  memberId: number;
  memberWalletAddress: string;
  receiverName: string;
  distributeAmount: number;
  updateId: number;

  coin?: CoinEntity;
  activityTitle?: string;
}
