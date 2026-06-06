import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';
import { AdminWorkspaceStatus } from '../dto/search-workspace.dto';

export type AdminFindAllWorkspaceFilter = {
  search?: string;
  plan?: PlanTypeWorkspace;
  status?: AdminWorkspaceStatus;
  createdFrom?: string;
  createdTo?: string;
  createdAt?: string;
  page?: number;
  pageSize?: number;
};
