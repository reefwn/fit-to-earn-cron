import { Controller, Get } from '@nestjs/common';
import { TaskService } from './task/task.service';

@Controller()
export class AppController {
  constructor(private taskService: TaskService) {}

  // TODO: for testing
  @Get('test')
  async test() {
    return this.taskService.distributionCoin();
  }
}
