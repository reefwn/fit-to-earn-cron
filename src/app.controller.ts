import { Controller, Get } from '@nestjs/common';
import { ActivityService } from './activity/activity.service';

@Controller()
export class AppController {
  constructor(private readonly activityService: ActivityService) {}

  // TODO: for testing
  @Get('test')
  async test() {
    return this.activityService.distributionCoin();
  }
}
