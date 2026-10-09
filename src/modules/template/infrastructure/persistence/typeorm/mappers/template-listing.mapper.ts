import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateListingOrmEntity } from '../entities/template-listing.orm-entity';

export class TemplateListingMapper {
  static toDomain(entity: TemplateListingOrmEntity): TemplateListing {
    return TemplateListing.restore({
      id: entity.id,
      templateId: entity.templateId,
      offerType: entity.offerType,
      status: entity.status,
      createdBy: entity.createdBy,
      publishedAt: entity.publishedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(domain: TemplateListing): TemplateListingOrmEntity {
    const entity = new TemplateListingOrmEntity();
    entity.id = domain.getId();
    entity.templateId = domain.getTemplateId();
    entity.offerType = domain.getOfferType();
    entity.status = domain.getStatus();
    entity.createdBy = domain.getCreatedBy();
    entity.publishedAt = domain.getPublishedAt();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();
    return entity;
  }
}
