import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { BillingProvider } from '../constants/billing-provider.constant';
import { BillingWebhookEvent } from '../entities/billing-webhook-event.entity';

export interface BillingWebhookEventRepository {
  save(
    webhookEvent: BillingWebhookEvent,
    context?: PersistenceContext,
  ): Promise<BillingWebhookEvent>;

  insertIfAbsent(
    webhookEvent: BillingWebhookEvent,
    context?: PersistenceContext,
  ): Promise<boolean>;

  findByProviderAndEventId(
    provider: BillingProvider,
    providerEventId: string,
    context?: PersistenceContext,
  ): Promise<BillingWebhookEvent | null>;
}
