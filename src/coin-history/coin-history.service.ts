import { CoinHistoryEntity } from 'src/entities/coin-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class CoinHistoryService {
  constructor(
    @InjectRepository(CoinHistoryEntity)
    private readonly coinHistoryRepo: Repository<CoinHistoryEntity>,
  ) {}

  create(entity: Partial<CoinHistoryEntity>): CoinHistoryEntity {
    return this.coinHistoryRepo.create(entity);
  }

  save(entity: CoinHistoryEntity): Promise<CoinHistoryEntity> {
    return this.coinHistoryRepo.save(entity);
  }
}
