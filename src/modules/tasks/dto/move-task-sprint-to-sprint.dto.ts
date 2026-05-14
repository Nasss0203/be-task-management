import { IsUUID } from 'class-validator';

export class MoveTaskSprintToSprintDto {
  @IsUUID()
  targetSprintId: string;
}
