import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskService } from './task/task.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private taskService: TaskService) {}

  sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async everyThirtySeconds() {
    await this.taskService.confirmTransaction();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async everyMinute() {
    await this.taskService.userNeedtoCheckout();
    await this.taskService.userNeedtoCheckin();
  }

  @Cron('0 */15 * * * *')
  async everyFifteenMinutes() {
    await this.taskService.distributionCoin();
    await this.sleep(1000);
    await this.taskService.crontabCancel();
  }

  @Cron('10 17 * * *')
  async everyTenMinutesPastMidnight() {
    await this.taskService.expireCoin();
  }

  @Cron('30 17 * * *')
  async everyThirtyMinutesPastMidnight() {
    await this.taskService.crontapGetHealth();
  }
}
