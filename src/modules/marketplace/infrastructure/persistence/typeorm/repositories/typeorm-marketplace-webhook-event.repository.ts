import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { EntityManager, Repository } from 'typeorm';

import { MarketplaceWebhookEvent } from '../../../../domain/entities/marketplace-webhook-event.entity';
import type { MarketplaceWebhookEventRepository } from '../../../../domain/repositories/marketplace-webhook-event.repository';
import { MarketplaceWebhookEventOrmEntity } from '../entities/marketplace-webhook-event.orm-entity';
import { MarketplaceWebhookEventMapper } from '../mappers/marketplace-webhook-event.mapper';

@Injectable()
export class TypeOrmMarketplaceWebhookEventRepository
  implements MarketplaceWebhookEventRepository
{
  constructor(
    @InjectRepository(MarketplaceWebhookEventOrmEntity)
    private readonly repository: Repository<MarketplaceWebhookEventOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<MarketplaceWebhookEventOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(MarketplaceWebhookEventOrmEntity)
      : this.repository;
  }

  async save(
    webhookEvent: MarketplaceWebhookEvent,
    context?: PersistenceContext,
  ): Promise<MarketplaceWebhookEvent> {
    const repository = this.getRepository(context);
    const saved = await repository.save(
      MarketplaceWebhookEventMapper.toOrm(webhookEvent),
    );

    return MarketplaceWebhookEventMapper.toDomain(saved);
  }

  async insertIfAbsent(
    webhookEvent: MarketplaceWebhookEvent,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repository = this.getRepository(context);
    const entity = MarketplaceWebhookEventMapper.toOrm(webhookEvent);

    const result = await repository
      .createQueryBuilder()
      .insert()
      .into(MarketplaceWebhookEventOrmEntity)
      .values({
        id: entity.id,
        provider: entity.provider,
        provider_event_id: entity.provider_event_id,
        event_type: entity.event_type,
        payload: () => 'CAST(:payload AS jsonb)',
        status: entity.status,
        processed_at: entity.processed_at,
        created_at: entity.created_at,
      })
      .setParameter('payload', JSON.stringify(entity.payload))
      .orIgnore()
      .returning(['id'])
      .execute();

    return Array.isArray(result.raw) && result.raw.length > 0;
  }

  async findByProviderAndEventId(
    provider: string,
    providerEventId: string,
    context?: PersistenceContext,
  ): Promise<MarketplaceWebhookEvent | null> {
    const entity = await this.getRepository(context).findOne({
      where: {
        provider,
        provider_event_id: providerEventId,
      },
    });

    return entity ? MarketplaceWebhookEventMapper.toDomain(entity) : null;
  }
}
