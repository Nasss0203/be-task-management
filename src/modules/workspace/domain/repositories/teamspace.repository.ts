import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { Teamspace } from '../aggregates/teamspace/teamspace.aggregate';

export interface TeamspaceRepository {
  save(teamspace: Teamspace, context?: PersistenceContext): Promise<Teamspace>;

  findById(id: string, context?: PersistenceContext): Promise<Teamspace | null>;

  findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Teamspace[]>;

  existsBySlug(
    workspaceId: string,
    slug: string,
    context?: PersistenceContext,
  ): Promise<boolean>;

  findAccessibleByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<Teamspace[]>;
}
