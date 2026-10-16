import { TemplateMarketplaceRelease } from '../../../../domain/aggregates/template-marketplace-release/template-marketplace-release.aggregate';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplateMarketplaceReleaseOrmEntity } from '../entities/template-marketplace-release.orm-entity';

export class TemplateMarketplaceReleaseMapper {
  static toDomain(
    entity: TemplateMarketplaceReleaseOrmEntity,
  ): TemplateMarketplaceRelease {
    return TemplateMarketplaceRelease.restore({
      id: entity.id,
      templateId: entity.templateId,
      versionId: entity.versionId,
      releasedAt: entity.releasedAt,
      releasedBy: entity.releasedBy,
      offerTypeAtRelease: entity.offerTypeAtRelease as TemplateOfferType,
    });
  }

  static toOrm(
    domain: TemplateMarketplaceRelease,
  ): TemplateMarketplaceReleaseOrmEntity {
    const entity = new TemplateMarketplaceReleaseOrmEntity();
    entity.id = domain.getId();
    entity.templateId = domain.getTemplateId();
    entity.versionId = domain.getVersionId();
    entity.releasedAt = domain.getReleasedAt();
    entity.releasedBy = domain.getReleasedBy();
    entity.offerTypeAtRelease = domain.getOfferTypeAtRelease();
    return entity;
  }
}
