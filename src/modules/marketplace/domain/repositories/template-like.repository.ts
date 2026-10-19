import type { PersistenceContext } from 'src/shared/domain/persistence-context';

export interface TemplateLikeRepository {
  add(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void>;

  remove(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void>;
}
