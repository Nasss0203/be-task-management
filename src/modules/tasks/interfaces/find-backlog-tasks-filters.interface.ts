import { TaskModel } from '../domain/models/task.model';
import type { TaskPositionContext } from 'src/modules/task_position/constants/task-position-context.constant';

export type TaskFilterValue = string | string[];
export type PaginationQueryValue = number | string;

export type FindBacklogTasksFilters = {
  search?: string;
  assigneeId?: TaskFilterValue;
  statusId?: TaskFilterValue;
  priorityId?: TaskFilterValue;
  context?: TaskPositionContext;
  contextId?: string;
  page?: PaginationQueryValue;
  pageSize?: PaginationQueryValue;
};

export type PaginatedTaskModels = {
  data: TaskModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
