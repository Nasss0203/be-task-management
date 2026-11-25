import { PublishedSite } from '../../../../domain/entities/published-site.entity';
import { PublishedSiteOrmEntity } from '../entities/published-site.orm-entity';

export class PublishedSiteMapper {
  static toDomain(orm: PublishedSiteOrmEntity): PublishedSite {
    return PublishedSite.restore({
      id: orm.id,
      workspaceId: orm.workspace_id,
      rootPageId: orm.root_page_id,
      subdomain: orm.subdomain,
      createdBy: orm.created_by,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
      disabledAt: orm.disabled_at,
      allowUpdates: orm.allow_updates,
      seo: {
        title: orm.seo_title ?? null,
        description: orm.seo_description ?? null,
        indexing: orm.search_indexing ?? false,
      },
      moderation: orm.moderation_disabled_at
        ? {
            disabledAt: orm.moderation_disabled_at,
            disabledBy: orm.moderation_disabled_by ?? null,
            reason: orm.moderation_reason ?? null,
          }
        : null,
    });
  }

  static toOrm(domain: PublishedSite): PublishedSiteOrmEntity {
    const orm = new PublishedSiteOrmEntity();
    orm.id = domain.getId();
    orm.workspace_id = domain.getWorkspaceId();
    orm.root_page_id = domain.getRootPageId();
    orm.subdomain = domain.getSubdomain();
    orm.allow_updates = domain.getAllowUpdates();
    orm.seo_title = domain.getSeo().title;
    orm.seo_description = domain.getSeo().description;
    orm.search_indexing = domain.getSeo().indexing;
    orm.created_by = domain.getCreatedBy();
    orm.created_at = domain.getCreatedAt();
    orm.updated_at = domain.getUpdatedAt();
    orm.disabled_at = domain.getDisabledAt();
    return orm;
  }
}
