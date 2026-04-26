import { IsUUID } from 'class-validator';

export class CreateTaskAssigneeDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  userId: string;
}
