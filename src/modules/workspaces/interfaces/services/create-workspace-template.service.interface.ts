import { EntityManager } from 'typeorm';
import { PlanTypeWorkspace } from '../../domain/entities/workspace.entity';
import { WorkspaceModel } from '../../domain/models/workspaces.model';
import { WorkspaceTemplateType } from '../../types/types';

export type CreateWorkspaceWithTemplateInput = {
  name: string;
  planType?: PlanTypeWorkspace;
  templateId?: string;
};

export interface CreateWorkspaceTemplateService {
  create(
    userId: string,
    input: CreateWorkspaceWithTemplateInput,
    manager?: EntityManager,
  ): Promise<WorkspaceModel>;
}
