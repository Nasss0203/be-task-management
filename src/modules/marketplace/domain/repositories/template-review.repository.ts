import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { TemplateReview } from '../entities/template-review.entity';

export interface TemplateReviewRepository {
  findByTemplateAndUser(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<TemplateReview | null>;

  save(
    review: TemplateReview,
    context?: PersistenceContext,
  ): Promise<TemplateReview>;

  deleteByTemplateAndUser(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<boolean>;
}
