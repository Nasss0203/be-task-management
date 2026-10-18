import type { PersistenceContext } from 'src/shared/domain/persistence-context';

export interface TemplateCreatorProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
}

/** Public creator profiles shown on marketplace listings (never email). */
export interface TemplateCreatorReader {
  findProfiles(
    userIds: string[],
    context?: PersistenceContext,
  ): Promise<Map<string, TemplateCreatorProfile>>;
}
