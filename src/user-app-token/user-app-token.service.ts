import { UserAppTokenEntity } from 'src/entities/user-app-token.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserAppTokenService {
  constructor(
    @InjectRepository(UserAppTokenEntity)
    private readonly userAppTokenRepo: Repository<UserAppTokenEntity>,
  ) {}

  find(options: FindManyOptions<UserAppTokenEntity>) {
    return this.userAppTokenRepo.find(options);
  }

  findByMemberId(memberId: number) {
    return this.userAppTokenRepo.find({
      where: { member_id: memberId },
      order: { created_at: 'DESC' },
      take: 5,
    });
  }
}
