import { Controller } from '@nestjs/common';
import { TaskPriorityService } from './task_priority.service';

@Controller('task-priority')
export class TaskPriorityController {
  constructor(private readonly taskPriorityService: TaskPriorityService) {}
}
