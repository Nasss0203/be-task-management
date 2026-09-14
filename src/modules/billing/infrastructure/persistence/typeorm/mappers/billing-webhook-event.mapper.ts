import { BillingWebhookEvent } from '../../../../domain/entities/billing-webhook-event.entity';
import { BillingWebhookEventOrmEntity } from '../entities/billing-webhook-event.orm-entity';

export class BillingWebhookEventMapper {
  static toDomain(entity: BillingWebhookEventOrmEntity): BillingWebhookEvent {
    return BillingWebhookEvent.reconstitute({
      id: entity.id,
      provider: entity.provider,
      providerEventId: entity.provider_event_id,
      eventType: entity.event_type,
      payload: entity.payload,
      status: entity.status,
      processedAt: entity.processed_at ?? null,
      createdAt: entity.created_at,
    });
  }

  static toOrm(
    webhookEvent: BillingWebhookEvent,
  ): BillingWebhookEventOrmEntity {
    const entity = new BillingWebhookEventOrmEntity();

    entity.id = webhookEvent.getId();
    entity.provider = webhookEvent.getProvider();
    entity.provider_event_id = webhookEvent.getProviderEventId();
    entity.event_type = webhookEvent.getEventType();
    entity.payload = webhookEvent.getPayload();
    entity.status = webhookEvent.getStatus();
    entity.processed_at = webhookEvent.getProcessedAt();
    entity.created_at = webhookEvent.getCreatedAt();

    return entity;
  }
}
