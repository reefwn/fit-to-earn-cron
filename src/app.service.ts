import { TaskService } from './task/task.service';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AppService {
  constructor(private taskService: TaskService) {}

  sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  @Cron('0 */15 * * * *')
  async distributionCoin() {
    await this.taskService.distributionCoin();
    await this.sleep(1000);
    await this.taskService.crontabCancel();
  }
}
