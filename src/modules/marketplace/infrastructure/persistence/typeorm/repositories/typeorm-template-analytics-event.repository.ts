import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { EntityManager, Repository } from 'typeorm';

import { TemplateAnalyticsEvent } from '../../../../domain/entities/template-analytics-event.entity';
import type { TemplateAnalyticsEventRepository } from '../../../../domain/repositories/template-analytics-event.repository';
import { TemplateAnalyticsEventOrmEntity } from '../entities/template-analytics-event.orm-entity';
import { TemplateAnalyticsEventMapper } from '../mappers/template-analytics-event.mapper';

@Injectable()
export class TypeOrmTemplateAnalyticsEventRepository implements TemplateAnalyticsEventRepository {
  constructor(
    @InjectRepository(TemplateAnalyticsEventOrmEntity)
    private readonly repository: Repository<TemplateAnalyticsEventOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<TemplateAnalyticsEventOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(
          TemplateAnalyticsEventOrmEntity,
        )
      : this.repository;
  }

  async insertIfAbsent(
    event: TemplateAnalyticsEvent,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const entity = TemplateAnalyticsEventMapper.toOrm(event);

    // ON CONFLICT DO NOTHING only absorbs unique conflicts (duplicate USE
    // source); CHECK and FK violations still throw.
    const result = await this.getRepository(context)
      .createQueryBuilder()
      .insert()
      .into(TemplateAnalyticsEventOrmEntity)
      .values({
        id: entity.id,
        templateId: entity.templateId,
        versionId: entity.versionId,
        eventType: entity.eventType,
        userId: entity.userId,
        sourceId: entity.sourceId,
        createdAt: entity.createdAt,
      })
      .orIgnore()
      .returning(['id'])
      .execute();

    return Array.isArray(result.raw) && result.raw.length > 0;
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateAnalyticsEvent | null> {
    const entity = await this.getRepository(context).findOne({
      where: { id },
    });

    return entity ? TemplateAnalyticsEventMapper.toDomain(entity) : null;
  }
}
