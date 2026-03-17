import { Module } from '@nestjs/common';
import { TaskPriorityService } from './task_priority.service';
import { TaskPriorityController } from './task_priority.controller';

@Module({
  controllers: [TaskPriorityController],
  providers: [TaskPriorityService],
})
export class TaskPriorityModule {}
