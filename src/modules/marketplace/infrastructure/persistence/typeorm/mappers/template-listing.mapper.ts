import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplatePrice } from '../../../../domain/value-objects/template-price.vo';
import { TemplateListingOrmEntity } from '../entities/template-listing.orm-entity';

export class TemplateListingMapper {
  static toDomain(entity: TemplateListingOrmEntity): TemplateListing {
    const amount = BigInt(entity.priceAmount);

    if (amount < 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('Template price amount is outside safe integer range');
    }

    const price = TemplatePrice.create({
      amount: Number(amount),
      currency: entity.currency,
    });

    return TemplateListing.restore({
      id: entity.id,
      templateId: entity.templateId,
      offerType: entity.offerType,
      status: entity.status,
      price,
      previewMode: entity.previewMode,
      demoVersionId: entity.demoVersionId,
      demoConfig: entity.demoConfig,
      createdBy: entity.createdBy,
      publishedAt: entity.publishedAt,
      publishedVersionId: entity.publishedVersionId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(domain: TemplateListing): TemplateListingOrmEntity {
    const entity = new TemplateListingOrmEntity();

    entity.id = domain.getId();
    entity.templateId = domain.getTemplateId();
    entity.offerType = domain.getOfferType();
    entity.previewMode = domain.getPreviewMode();
    entity.demoVersionId = domain.getDemoVersionId();
    entity.demoConfig = domain.getDemoConfig();

    // TemplatePrice -> PostgreSQL
    const price = domain.getPrice();

    entity.priceAmount = price.getAmount().toString();
    entity.currency = price.getCurrency();

    entity.status = domain.getStatus();
    entity.createdBy = domain.getCreatedBy();
    entity.publishedAt = domain.getPublishedAt();
    entity.publishedVersionId = domain.getPublishedVersionId();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();

    return entity;
  }
}
