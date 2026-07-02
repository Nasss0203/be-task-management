import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FindBacklogTasksFilters } from '../interfaces/find-backlog-tasks-filters.interface';
import {
  TASK_POSITION_CONTEXTS,
  type TaskPositionContext,
} from 'src/modules/task_position/constants/task-position-context.constant';

const toIdArray = ({ value }: TransformFnParams): string[] | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
};

const toNumber = ({ value }: TransformFnParams): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
};

export class FindBacklogTasksQueryDto implements FindBacklogTasksFilters {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @Transform(toIdArray)
  @IsUUID('4', { each: true })
  assigneeId?: string | string[];

  @IsOptional()
  @Transform(toIdArray)
  @IsUUID('4', { each: true })
  statusId?: string | string[];

  @IsOptional()
  @Transform(toIdArray)
  @IsUUID('4', { each: true })
  priorityId?: string | string[];

  @IsOptional()
  @IsIn(TASK_POSITION_CONTEXTS)
  context?: TaskPositionContext;

  @IsOptional()
  @IsUUID()
  contextId?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
