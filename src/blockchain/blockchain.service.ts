import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import { BlockChainDataDto } from 'src/blockchain/blockchain.dto';

@Injectable()
export class BlockChainService {
  constructor(private httpService: HttpService) {}

  async tranferCoinFromAdmin(data: BlockChainDataDto) {
    const observable = this.httpService
      .post(`${process.env.BATCH_TRANSFER}/transfer`, {
        address: data.address,
        receiver: data.receiver,
        coin: data.coin,
        amount: data.amount,
      })
      .pipe(map((res) => res.data));
    const response = await lastValueFrom(observable);

    return response;
  }
}
