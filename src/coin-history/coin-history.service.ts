import { CoinHistoryEntity } from 'src/entities/coin-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

@Injectable()
export class CoinHistoryService {
  constructor(
    @InjectRepository(CoinHistoryEntity)
    private readonly coinHistoryRepo: Repository<CoinHistoryEntity>,
  ) {}

  find(options: FindManyOptions<CoinHistoryEntity>) {
    return this.coinHistoryRepo.find(options);
  }

  create(entity: Partial<CoinHistoryEntity>): CoinHistoryEntity {
    return this.coinHistoryRepo.create(entity);
  }

  save(entity: CoinHistoryEntity): Promise<CoinHistoryEntity> {
    return this.coinHistoryRepo.save(entity);
  }

  update(
    criteria: FindOptionsWhere<CoinHistoryEntity>,
    options: QueryDeepPartialEntity<CoinHistoryEntity>,
  ) {
    options.updated_at = new Date();
    return this.coinHistoryRepo.update(criteria, options);
  }
}
