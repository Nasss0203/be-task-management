import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { MarketplaceWebhookEvent } from '../entities/marketplace-webhook-event.entity';

export interface MarketplaceWebhookEventRepository {
  save(
    webhookEvent: MarketplaceWebhookEvent,
    context?: PersistenceContext,
  ): Promise<MarketplaceWebhookEvent>;

  insertIfAbsent(
    webhookEvent: MarketplaceWebhookEvent,
    context?: PersistenceContext,
  ): Promise<boolean>;

  findByProviderAndEventId(
    provider: string,
    providerEventId: string,
    context?: PersistenceContext,
  ): Promise<MarketplaceWebhookEvent | null>;
}
