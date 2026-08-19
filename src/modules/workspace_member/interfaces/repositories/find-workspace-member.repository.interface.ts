import { EntityManager } from 'typeorm';
import { WorkspaceMemberDetailModel } from '../../domain/models/workspace-member.model';

export interface FindWorkspaceMemberRepository {
  findMemberInWorkspace(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberDetailModel | null>;

  findAllMember(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberDetailModel[]>;
}
