import { IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  TASK_POSITION_CONTEXTS,
  type TaskPositionContext,
} from '../constants/task-position-context.constant';

export class ReorderTaskPositionDto {
  @IsUUID()
  taskId: string;

  @IsIn(TASK_POSITION_CONTEXTS)
  context: TaskPositionContext;

  @IsUUID()
  contextId: string;

  @IsOptional()
  @IsUUID()
  previousTaskId?: string | null;

  @IsOptional()
  @IsUUID()
  nextTaskId?: string | null;
}
