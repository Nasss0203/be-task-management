import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';

export type AdminFindAllWorkspaceFilter = {
  search?: string;
  plan?: PlanTypeWorkspace;
  createdFrom?: string;
  createdTo?: string;
  createdAt?: string;
};
