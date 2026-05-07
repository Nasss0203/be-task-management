import { PartialType } from '@nestjs/swagger';
import { CreateTaskCommnentDto } from './create-task_commnent.dto';

export class UpdateTaskCommnentDto extends PartialType(CreateTaskCommnentDto) {}
