import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { PageTemplateVersionOrmEntity } from '../entities/page-template-version.orm-entity';

export class TemplateVersionMapper {
  static toDomain(entity: PageTemplateVersionOrmEntity): TemplateVersion {
    return TemplateVersion.restore({
      id: entity.id,
      templateId: entity.templateId,
      versionNumber: entity.versionNumber,
      status: entity.status,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      publishedAt: entity.publishedAt,
    });
  }

  static toOrm(domain: TemplateVersion): PageTemplateVersionOrmEntity {
    const entity = new PageTemplateVersionOrmEntity();
    entity.id = domain.getId();
    entity.templateId = domain.getTemplateId();
    entity.versionNumber = domain.getVersionNumber();
    entity.status = domain.getStatus();
    entity.createdBy = domain.getCreatedBy();
    entity.publishedAt = domain.getPublishedAt();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();
    return entity;
  }
}
