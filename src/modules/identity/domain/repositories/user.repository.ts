import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { SystemRole } from '../enums/system-role.enum';
import { UserModel } from '../aggregates/user/user.model';

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  googleId: string | null;
  avatarUrl: string | null;
  passwordHash: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  systemRole: SystemRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateLocalUserInput {
  email: string;
  username: string;
  passwordHash: string;
  emailVerificationToken: string;
  emailVerificationExpires: Date;
}

export interface CreateGoogleUserInput {
  email: string;
  username: string;
  googleId: string;
  avatarUrl: string | null;
}

export type InviteUserSuggestionStatus =
  | 'CAN_INVITE'
  | 'MEMBER'
  | 'PENDING_INVITE';

export interface SearchInviteUsersInput {
  workspaceId: string;
  keyword: string;
  currentUserId: string;
}

export interface SearchInviteUsersOutput {
  user_id: string;
  username: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: InviteUserSuggestionStatus;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findByGoogleId(googleId: string): Promise<UserRecord | null>;
  findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<UserRecord | null>;
  findByEmailAndUsername(
    email: string,
    username: string,
  ): Promise<UserRecord | null>;
  findByEmailVerificationToken(token: string): Promise<UserRecord | null>;
  findByResetPasswordToken(token: string): Promise<UserRecord | null>;
  findProfileById(id: string): Promise<UserRecord | null>;
  createLocalUser(
    input: CreateLocalUserInput,
    context?: PersistenceContext,
  ): Promise<UserRecord>;
  createGoogleUser(input: CreateGoogleUserInput): Promise<UserRecord>;
  save(user: UserRecord): Promise<UserRecord>;

  findUserByUsername(username: string): Promise<UserModel | null>;
  findUserByEmail(email: string): Promise<UserModel | null>;
  findUserById(id: string): Promise<UserModel | null>;
  searchUsers(
    keyword: string,
    context?: PersistenceContext,
  ): Promise<UserModel[]>;
  searchInviteUsers(
    input: SearchInviteUsersInput,
    context?: PersistenceContext,
  ): Promise<SearchInviteUsersOutput[]>;
}
