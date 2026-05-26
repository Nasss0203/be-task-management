import { TaskModel } from '../domain/models/task.model';

export type TaskFilterValue = string | string[];
export type PaginationQueryValue = number | string;

export type FindBacklogTasksFilters = {
  search?: string;
  assigneeId?: TaskFilterValue;
  statusId?: TaskFilterValue;
  priorityId?: TaskFilterValue;
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
