import { CoinEntity } from 'src/entities/coin.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CoinService {
  constructor(
    @InjectRepository(CoinEntity)
    private readonly coinRepo: Repository<CoinEntity>,
  ) {}

  async findOne(options: FindOneOptions<CoinEntity>) {
    return this.coinRepo.findOne(options);
  }

  async findByName(name: string) {
    return this.coinRepo.findOne({ where: { name } });
  }
}
