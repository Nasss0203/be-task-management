import {
  WorkspaceMember,
  WorkspaceMemberDetail,
} from '../aggregates/workspace-member/workspace-member.aggregate';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface WorkspaceMemberRepository {
  save(
    member: WorkspaceMember,
    context?: PersistenceContext,
  ): Promise<WorkspaceMember>;

  findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceMember | null>;

  findByWorkspace(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceMember[]>;

  findDetailsByWorkspace(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceMemberDetail[]>;

  findDetailByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceMemberDetail | null>;

  deleteByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void>;

  deleteByWorkspaceAndUserIfWorkspaceDeleted(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void>;
}
