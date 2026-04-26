import { IsOptional, IsUUID } from 'class-validator';

export class CreateTaskAssigneeDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  assignedBy: string;
}
