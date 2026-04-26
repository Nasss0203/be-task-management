import { EntityManager } from 'typeorm';
import { MemberWorkspaceModel } from '../../domain/models/user_workspace.model';

export interface FindMemberService {
  findAllMember(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<MemberWorkspaceModel[]>;

  findMemberInWorkspace(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<MemberWorkspaceModel | null>;
}
