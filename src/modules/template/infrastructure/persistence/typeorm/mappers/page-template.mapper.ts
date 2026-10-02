import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { PageTemplateOrmEntity } from '../entities/page-template.orm-entity';

export class PageTemplateMapper {
  static toDomain(entity: PageTemplateOrmEntity): PageTemplate {
    return PageTemplate.restore({
      id: entity.id,
      sourcePageId: entity.sourcePageId,
      workspaceId: entity.workspaceId,
      name: entity.name,
      description: entity.description,
      icon: entity.icon,
      coverUrl: entity.coverUrl,
      createdBy: entity.createdBy,
      status: entity.status,
      visibility: entity.visibility,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(domain: PageTemplate): PageTemplateOrmEntity {
    const entity = new PageTemplateOrmEntity();
    entity.id = domain.getId();
    entity.sourcePageId = domain.getSourcePageId();
    entity.workspaceId = domain.getWorkspaceId();
    entity.name = domain.getName();
    entity.description = domain.getDescription();
    entity.icon = domain.getIcon();
    entity.coverUrl = domain.getCoverUrl();
    entity.createdBy = domain.getCreatedBy();
    entity.status = domain.getStatus();
    entity.visibility = domain.getVisibility();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();
    return entity;
  }
}
