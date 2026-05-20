import { EntityManager } from 'typeorm';
import { WorkspaceMemberSummaryModel } from '../../domain/models/workspace-member-summary.model';

export interface AdminWorkspaceMemberSummaryRepository {
  getMemberSummary(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberSummaryModel>;
}
