import { EntityManager } from 'typeorm';
import { WorkspaceMemberDetailModel } from '../../domain/models/workspace-member.model';

export interface FindWorkspaceMemberService {
  findAllMember(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberDetailModel[]>;

  findMemberInWorkspace(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberDetailModel | null>;
}
