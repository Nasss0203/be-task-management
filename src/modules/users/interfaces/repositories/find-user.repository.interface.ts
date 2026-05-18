import { EntityManager } from 'typeorm';
import { UserModel } from '../../domain/models/user.model';
export type InviteUserSuggestionStatus =
  | 'CAN_INVITE'
  | 'MEMBER'
  | 'PENDING_INVITE';

export interface SearchInviteUsersRepositoryInput {
  workspaceId: string;
  keyword: string;
  currentUserId: string;
}

export interface SearchInviteUsersRepositoryOutput {
  user_id: string;
  username: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: InviteUserSuggestionStatus;
}

export interface FindUserRepository {
  findUserByUsername(username: string): Promise<UserModel | null>;
  findUserByEmail(email: string): Promise<UserModel | null>;
  findUserById(id: string): Promise<UserModel | null>;

  searchUsers(keyword: string, manager?: EntityManager): Promise<UserModel[]>;

  searchInviteUsers(
    input: SearchInviteUsersRepositoryInput,
    manager?: EntityManager,
  ): Promise<SearchInviteUsersRepositoryOutput[]>;
}
