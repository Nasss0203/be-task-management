import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, Repository } from 'typeorm';

import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { BillingWebhookEvent } from '../../../../domain/entities/billing-webhook-event.entity';
import type { BillingWebhookEventRepository } from '../../../../domain/repositories/billing-webhook-event.repository';
import { BillingWebhookEventOrmEntity } from '../entities/billing-webhook-event.orm-entity';
import { BillingWebhookEventMapper } from '../mappers/billing-webhook-event.mapper';

@Injectable()
export class TypeOrmBillingWebhookEventRepository implements BillingWebhookEventRepository {
  constructor(
    @InjectRepository(BillingWebhookEventOrmEntity)
    private readonly repository: Repository<BillingWebhookEventOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<BillingWebhookEventOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(BillingWebhookEventOrmEntity)
      : this.repository;
  }

  async save(
    webhookEvent: BillingWebhookEvent,
    context?: PersistenceContext,
  ): Promise<BillingWebhookEvent> {
    const repository = this.getRepository(context);
    const saved = await repository.save(
      BillingWebhookEventMapper.toOrm(webhookEvent),
    );

    return BillingWebhookEventMapper.toDomain(saved);
  }

  async insertIfAbsent(
    webhookEvent: BillingWebhookEvent,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repository = this.getRepository(context);
    const entity = BillingWebhookEventMapper.toOrm(webhookEvent);

    const result = await repository
      .createQueryBuilder()
      .insert()
      .into(BillingWebhookEventOrmEntity)
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
    provider: BillingProvider,
    providerEventId: string,
    context?: PersistenceContext,
  ): Promise<BillingWebhookEvent | null> {
    const entity = await this.getRepository(context).findOne({
      where: {
        provider,
        provider_event_id: providerEventId,
      },
    });

    return entity ? BillingWebhookEventMapper.toDomain(entity) : null;
  }
}
