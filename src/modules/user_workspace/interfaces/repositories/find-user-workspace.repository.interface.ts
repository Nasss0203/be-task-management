import { EntityManager } from 'typeorm';
import {
  MemberWorkspaceModel,
  UserWorkspaceModel,
} from '../../domain/models/user_workspace.model';

export interface FindUserWorkspaceRepository {
  findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<UserWorkspaceModel | null>;

  findAllMember(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<MemberWorkspaceModel[]>;
}
