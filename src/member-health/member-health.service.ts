import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { MemberHealthEntity } from 'src/entities/member-health.entity';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MemberHealthService {
  constructor(
    @InjectRepository(MemberHealthEntity)
    private readonly memberHealthRepo: Repository<MemberHealthEntity>,
  ) {}

  findOne(options: FindOneOptions<MemberHealthEntity>) {
    return this.memberHealthRepo.findOne(options);
  }

  create(entity: Partial<MemberHealthEntity>): MemberHealthEntity {
    return this.memberHealthRepo.create(entity);
  }

  save(entity: MemberHealthEntity): Promise<MemberHealthEntity> {
    return this.memberHealthRepo.save(entity);
  }

  update(
    criteria: FindOptionsWhere<MemberHealthEntity>,
    options: QueryDeepPartialEntity<MemberHealthEntity>,
  ) {
    options.updated_at = new Date();
    return this.memberHealthRepo.update(criteria, options);
  }
}
