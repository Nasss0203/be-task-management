import { PageTemplate } from 'src/modules/content/domain/aggregates/page-template/page-template.aggregate';
import { PageTemplateOrmEntity } from '../entities/page-template.orm-entity';

export class PageTemplateMapper {
  static toDomain(orm: PageTemplateOrmEntity): PageTemplate {
    return PageTemplate.restore({
      id: orm.id,
      workspaceId: orm.workspaceId,
      name: orm.name,
      description: orm.description,
      icon: orm.icon,
      coverUrl: orm.coverUrl,
      category: orm.category,
      isSystem: orm.isSystem,
      createdBy: orm.createdBy,
      status: orm.status,
      visibility: orm.visibility,
      useCount: orm.useCount,
      likesCount: orm.likesCount,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
    });
  }

  static toOrm(domain: PageTemplate): PageTemplateOrmEntity {
    const orm = new PageTemplateOrmEntity();
    orm.id = domain.getId();
    orm.workspaceId = domain.getWorkspaceId();
    orm.name = domain.getName();
    orm.description = domain.getDescription();
    orm.icon = domain.getIcon();
    orm.coverUrl = domain.getCoverUrl();
    orm.category = domain.getCategory();
    orm.isSystem = domain.getIsSystem();
    orm.createdBy = domain.getCreatedBy();
    orm.status = domain.getStatus();
    orm.visibility = domain.getVisibility();
    orm.useCount = domain.getUseCount();
    orm.likesCount = domain.getLikesCount();
    orm.createdAt = domain.getCreatedAt();
    orm.updatedAt = domain.getUpdatedAt();
    orm.deletedAt = domain.getDeletedAt();
    return orm;
  }
}
