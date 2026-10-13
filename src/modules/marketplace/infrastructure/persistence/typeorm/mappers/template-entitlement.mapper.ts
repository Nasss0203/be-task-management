import { TemplateEntitlement } from '../../../../domain/aggregates/template-entitlement/template-entitlement.aggregate';
import { TemplateEntitlementOrmEntity } from '../entities/template-entitlement.orm-entity';

export class TemplateEntitlementMapper {
  static toDomain(entity: TemplateEntitlementOrmEntity): TemplateEntitlement {
    return TemplateEntitlement.restore({
      id: entity.id,
      templateId: entity.templateId,
      userId: entity.userId,
      source: entity.source,
      createdAt: entity.createdAt,
    });
  }

  static toOrm(domain: TemplateEntitlement): TemplateEntitlementOrmEntity {
    const entity = new TemplateEntitlementOrmEntity();
    entity.id = domain.getId();
    entity.templateId = domain.getTemplateId();
    entity.userId = domain.getUserId();
    entity.source = domain.getSource();
    entity.createdAt = domain.getCreatedAt();
    return entity;
  }
}
