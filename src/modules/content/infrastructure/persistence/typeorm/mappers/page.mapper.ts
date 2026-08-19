import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { PageOrmEntity } from '../entities/page.orm-entity';

export class PageMapper {
  static toDomain(orm: PageOrmEntity): Page {
    return Page.restore({
      id: orm.id,
      workspaceId: orm.workspace_id,
      title: orm.title,
      slug: orm.slug,
      icon: orm.icon,
      coverUrl: orm.cover_url,
      isTemplate: orm.is_template,
      createdBy: orm.created_by,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
      deletedBy: orm.deletedBy,
    });
  }

  static toOrm(domain: Page): PageOrmEntity {
    const orm = new PageOrmEntity();
    orm.id = domain.getId();
    orm.workspace_id = domain.getWorkspaceId();
    orm.title = domain.getTitle();
    orm.slug = domain.getSlug();
    orm.icon = domain.getIcon();
    orm.cover_url = domain.getCoverUrl();
    orm.is_template = domain.getIsTemplate();
    orm.created_by = domain.getCreatedBy();
    orm.createdAt = domain.getCreatedAt();
    orm.updatedAt = domain.getUpdatedAt();
    orm.deletedAt = domain.getDeletedAt();
    orm.deletedBy = domain.getDeletedBy();
    return orm;
  }
}
