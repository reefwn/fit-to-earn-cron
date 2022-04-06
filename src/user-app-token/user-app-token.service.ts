import { UserAppTokenEntity } from 'src/entities/user-app-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { FindManyOptions, Repository } from 'typeorm';

@Injectable()
export class UserAppTokenService {
  constructor(
    @InjectRepository(UserAppTokenEntity)
    private readonly userAppTokenRepo: Repository<UserAppTokenEntity>,
  ) {}

  find(options: FindManyOptions<UserAppTokenEntity>) {
    return this.userAppTokenRepo.find(options);
  }
}
