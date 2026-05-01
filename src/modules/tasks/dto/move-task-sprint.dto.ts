// src/modules/tasks/dto/move-task-sprint.dto.ts

import { IsOptional, IsUUID } from 'class-validator';

export class MoveTaskSprintDto {
  @IsOptional()
  @IsUUID()
  sprintId?: string | null;
}
