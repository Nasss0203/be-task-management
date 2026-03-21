import { PartialType } from '@nestjs/swagger';
import { CreateTaskStatusDto } from './create-task_status.dto';

export class UpdateTaskStatusDto extends PartialType(CreateTaskStatusDto) {}
