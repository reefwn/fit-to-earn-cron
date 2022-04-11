import { HealthConfigEntity } from 'src/entities/health-config.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthConfigService {
  constructor(
    @InjectRepository(HealthConfigEntity)
    private readonly memberRepo: Repository<HealthConfigEntity>,
  ) {}

  find(options: FindManyOptions<HealthConfigEntity>) {
    return this.memberRepo.find(options);
  }
}
