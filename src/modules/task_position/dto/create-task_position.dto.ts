import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsUUID, Min } from 'class-validator';
import {
  TASK_POSITION_CONTEXTS,
  type TaskPositionContext,
} from '../constants/task-position-context.constant';

export class CreateTaskPositionDto {
  @IsUUID()
  taskId: string;

  @IsIn(TASK_POSITION_CONTEXTS)
  context: TaskPositionContext;

  @IsUUID()
  contextId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  position: number;
}
