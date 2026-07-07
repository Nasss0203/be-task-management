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

export class CreateSubtaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

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
