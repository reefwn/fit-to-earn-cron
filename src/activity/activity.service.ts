import { ActivityEntity } from 'src/entities/activity.entity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions } from 'typeorm';

export class ActivityService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
  ) {}

  find(options: FindManyOptions<ActivityEntity>) {
    return this.activityRepo.find(options);
  }
}
