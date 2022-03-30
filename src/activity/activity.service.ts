import { ActivityEnrollmentStatus } from 'src/activity-enrollment/activity-enrollment.enum';
import { ActivityEntity } from 'src/entities/activity.entity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan } from 'typeorm';
import {
  ActivityRequireCheckinCheckout,
  ActivityStatus,
} from './activity.enum';

export class ActivityService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
  ) {}

  async distributionCoin() {
    const date = new Date();
    // const timestamp = +date + 14 * 60 * 60 * 1000;

    const activityBaseQuery = { status: ActivityStatus.APPROVE };
    const enrollmentBaseQuery = { member: true };
    const enrollmentQuery = [
      { ...enrollmentBaseQuery, status: ActivityEnrollmentStatus.CHECKIN },
      { ...enrollmentBaseQuery, status: ActivityEnrollmentStatus.CHECKOUT },
    ];

    const activities = await this.activityRepo.find({
      relations: { enrollments: { member: true } },
      where: [
        {
          ...activityBaseQuery,
          req_checkin: ActivityRequireCheckinCheckout.NO,
          end_date: LessThan(date),
          enrollments: enrollmentQuery,
        },
        {
          ...activityBaseQuery,
          req_checkout: ActivityRequireCheckinCheckout.NO,
          final_checkout: LessThan(date),
          enrollments: enrollmentQuery,
        },
      ],
    });

    // TODO : loop through enrollment and calculate coin
    // for (let i=0; i<activities.length; i++) {

    // }

    return { activities };
  }
}
