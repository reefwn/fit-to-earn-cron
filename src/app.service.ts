import { TaskService } from './task/task.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppService {
  constructor(private taskService: TaskService) {}

  sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async every30seconds() {
    await this.taskService.confirmTransaction();
  }

  @Cron('0 */15 * * * *')
  async every15minutes() {
    await this.taskService.distributionCoin();
    await this.sleep(1000);
    await this.taskService.crontabCancel();
  }

  @Cron('10 17 * * *')
  async midnight10minutes() {
    await this.taskService.expireCoin();
  }
}
