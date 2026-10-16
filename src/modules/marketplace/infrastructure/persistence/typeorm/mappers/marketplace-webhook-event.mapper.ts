import { MarketplaceWebhookEvent } from '../../../../domain/entities/marketplace-webhook-event.entity';
import { MarketplaceWebhookEventOrmEntity } from '../entities/marketplace-webhook-event.orm-entity';

export class MarketplaceWebhookEventMapper {
  static toDomain(
    entity: MarketplaceWebhookEventOrmEntity,
  ): MarketplaceWebhookEvent {
    return MarketplaceWebhookEvent.reconstitute({
      id: entity.id,
      provider: entity.provider,
      providerEventId: entity.provider_event_id,
      eventType: entity.event_type,
      payload: entity.payload,
      status: entity.status,
      processedAt: entity.processed_at,
      createdAt: entity.created_at,
    });
  }

  static toOrm(
    domain: MarketplaceWebhookEvent,
  ): MarketplaceWebhookEventOrmEntity {
    const entity = new MarketplaceWebhookEventOrmEntity();

    entity.id = domain.getId();
    entity.provider = domain.getProvider();
    entity.provider_event_id = domain.getProviderEventId();
    entity.event_type = domain.getEventType();
    entity.payload = domain.getPayload();
    entity.status = domain.getStatus();
    entity.processed_at = domain.getProcessedAt();
    entity.created_at = domain.getCreatedAt();

    return entity;
  }
}
