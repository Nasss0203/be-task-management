import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { UserModel } from '../..//domain/aggregates/user/user.model';

export type InviteUserSuggestionStatus =
  | 'CAN_INVITE'
  | 'MEMBER'
  | 'PENDING_INVITE';

export interface SearchInviteUsersServiceInput {
  workspaceId: string;
  keyword: string;
  currentUserId: string;
}

export interface SearchInviteUsersServiceOutput {
  user_id: string;
  username: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: InviteUserSuggestionStatus;
}
export interface FindUserService {
  findUserByUsername(username: string): Promise<UserModel | null>;
  findUserByEmail(email: string): Promise<UserModel | null>;
  findUserById(id: string): Promise<UserModel | null>;
  searchUsers(
    keyword: string,
    context?: PersistenceContext,
  ): Promise<UserModel[]>;

  searchInviteUsers(
    input: SearchInviteUsersServiceInput,
  ): Promise<SearchInviteUsersServiceOutput[]>;
}
