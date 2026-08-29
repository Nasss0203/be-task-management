import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { TeamspaceMember } from '../entities/teamspace-member.entity';

export interface TeamspaceMemberRepository {
  save(
    member: TeamspaceMember,
    context?: PersistenceContext,
  ): Promise<TeamspaceMember>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TeamspaceMember | null>;

  findByTeamspaceAndWorkspaceMember(
    teamspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<TeamspaceMember | null>;

  findByTeamspaceId(
    teamspaceId: string,
    context?: PersistenceContext,
  ): Promise<TeamspaceMember[]>;

  exists(
    teamspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<boolean>;

  delete(
    teamspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<void>;
}
