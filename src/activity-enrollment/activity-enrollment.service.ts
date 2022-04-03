import { ActivityEnrollmentEntity } from 'src/entities/activity-enrollment.entity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class ActivityEnrollmentService {
  constructor(
    @InjectRepository(ActivityEnrollmentEntity)
    private readonly activityEnrollmentRepo: Repository<ActivityEnrollmentEntity>,
  ) {}

  update(
    criteria: FindOptionsWhere<ActivityEnrollmentEntity>,
    options: QueryDeepPartialEntity<ActivityEnrollmentEntity>,
  ) {
    options.updated_at = new Date();
    return this.activityEnrollmentRepo.update(criteria, options);
  }
}
