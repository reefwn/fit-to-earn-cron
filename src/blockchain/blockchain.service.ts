import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import { BlockChainDataDto } from 'src/blockchain/blockchain.dto';

@Injectable()
export class BlockChainService {
  constructor(private httpService: HttpService) {}

  async tranferCoinFromAdmin(data: BlockChainDataDto) {
    const observable = this.httpService
      .post(`${process.env.BATCH_TRANSFER}/transfer`, data)
      .pipe(map((res) => res.data));
    const response = await lastValueFrom(observable);

    return response;
  }

  async transferCoin(data: BlockChainDataDto) {
    const observable = this.httpService
      .post(`${process.env.BLOCKCHAIN_IP}/transfer`, data)
      .pipe(map((res) => res.data));
    const response = await lastValueFrom(observable);

    return response;
  }
}
