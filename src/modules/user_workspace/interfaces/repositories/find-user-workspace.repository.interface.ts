import { EntityManager } from 'typeorm';
import { MemberWorkspaceModel } from '../../domain/models/user_workspace.model';

export interface FindUserWorkspaceRepository {
  findMemberInWorkspace(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<MemberWorkspaceModel | null>;

  findAllMember(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<MemberWorkspaceModel[]>;
}
