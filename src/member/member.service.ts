import { MemberEntity } from 'src/entities/member.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
  ) {}

  find(options: FindManyOptions<MemberEntity>) {
    return this.memberRepo.find(options);
  }
}
