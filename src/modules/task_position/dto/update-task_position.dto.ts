import { PartialType } from '@nestjs/swagger';
import { CreateTaskPositionDto } from './create-task_position.dto';

export class UpdateTaskPositionDto extends PartialType(CreateTaskPositionDto) {}
