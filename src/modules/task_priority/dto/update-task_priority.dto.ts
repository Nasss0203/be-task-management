import { PartialType } from '@nestjs/swagger';
import { CreateTaskPriorityDto } from './create-task_priority.dto';

export class UpdateTaskPriorityDto extends PartialType(CreateTaskPriorityDto) {}
