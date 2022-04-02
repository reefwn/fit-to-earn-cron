import { ActivityEnrollmentStatus } from 'src/activity-enrollment/activity-enrollment.enum';
import { DocumentNumberService } from 'src/document-number/document-number.service';
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
    private readonly documentNumberService: DocumentNumberService,
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
      relations: { reciever_token: true, enrollments: { member: true } },
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
    for (let i = 0; i < activities.length; i++) {
      for (let j = 0; j < activities[i].enrollments.length; j++) {
        const memberCsrTime =
          activities[i].enrollments[j].cumulative_csrtime || 0;

        if (+memberCsrTime >= +activities[i].minimum_csrtime) {
          const totalCoinDistributed = activities[i].amount_giveaways;
          let timeCSRUser =
            memberCsrTime >= activities[i].cumulative_minute
              ? memberCsrTime
              : activities[i].cumulative_minute;

          if (timeCSRUser === 0) {
            timeCSRUser = 1;
          }
          if (memberCsrTime === 0 && activities[i].minimum_csrtime === 0) {
            timeCSRUser = activities[i].cumulative_minute;
          }

          let userCsrtime =
            ((timeCSRUser / activities[i].cumulative_minute) *
              (100 * totalCoinDistributed)) /
            100;
          if (+userCsrtime === 0) {
            userCsrtime =
              activities[i].minimum_csrtime === 0
                ? activities[i].amount_giveaways
                : 1;
          }

          const dataTransfer = {
            address: process.env.walletAddress,
            receiver: activities[i].enrollments[j].member.wallet_address,
            coin: activities[i].receiver_token_type,
            amount: userCsrtime,
          };

          const transactionNo = await this.documentNumberService.getRunNo();

          // TODO: create transaction service
        }
      }
    }

    return { activities };
  }
}
