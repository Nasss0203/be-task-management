import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTaskDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  sprintId?: string | null;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsUUID()
  statusId: string;

  @IsOptional()
  @IsUUID()
  priorityId?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startAt?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date | null;

  /*
   * Không nên để client tự gửi completedAt khi tạo task.
   * completedAt phải do backend thiết lập khi task chuyển sang trạng thái Done.
   */

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimateMinutes?: number | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  initialComment?: string | null;
}