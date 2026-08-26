import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { UserProfileAggregate } from '../aggregates/user-profile/user-profile.aggregate';

export interface UserProfileRepository {
  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<UserProfileAggregate | null>;

  findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<UserProfileAggregate | null>;

  save(
    profile: UserProfileAggregate,
    context?: PersistenceContext,
  ): Promise<void>;
}
