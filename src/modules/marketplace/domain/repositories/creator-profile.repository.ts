import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { CreatorProfile } from '../entities/creator-profile.entity';

export interface CreatorProfileRepository {
  findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<CreatorProfile | null>;

  save(
    profile: CreatorProfile,
    context?: PersistenceContext,
  ): Promise<CreatorProfile>;
}
