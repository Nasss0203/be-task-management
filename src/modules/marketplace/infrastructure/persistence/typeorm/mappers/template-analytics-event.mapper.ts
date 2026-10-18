import { TemplateAnalyticsEvent } from '../../../../domain/entities/template-analytics-event.entity';
import { TemplateAnalyticsEventOrmEntity } from '../entities/template-analytics-event.orm-entity';

export class TemplateAnalyticsEventMapper {
  static toDomain(
    entity: TemplateAnalyticsEventOrmEntity,
  ): TemplateAnalyticsEvent {
    return TemplateAnalyticsEvent.reconstitute({
      id: entity.id,
      templateId: entity.templateId,
      versionId: entity.versionId,
      eventType: entity.eventType,
      userId: entity.userId,
      sourceId: entity.sourceId,
      createdAt: entity.createdAt,
    });
  }

  static toOrm(
    domain: TemplateAnalyticsEvent,
  ): TemplateAnalyticsEventOrmEntity {
    const entity = new TemplateAnalyticsEventOrmEntity();

    entity.id = domain.getId();
    entity.templateId = domain.getTemplateId();
    entity.versionId = domain.getVersionId();
    entity.eventType = domain.getEventType();
    entity.userId = domain.getUserId();
    entity.sourceId = domain.getSourceId();
    entity.createdAt = domain.getCreatedAt();

    return entity;
  }
}
