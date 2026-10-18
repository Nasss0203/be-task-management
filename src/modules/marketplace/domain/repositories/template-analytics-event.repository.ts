import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { TemplateAnalyticsEvent } from '../entities/template-analytics-event.entity';

export interface TemplateAnalyticsEventRepository {
  /**
   * Inserts the event. Returns false when a USE event with the same source ID
   * already exists; every other database error is thrown.
   */
  insertIfAbsent(
    event: TemplateAnalyticsEvent,
    context?: PersistenceContext,
  ): Promise<boolean>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateAnalyticsEvent | null>;
}
