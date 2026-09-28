import { PagePublication } from '../../../../domain/entities/page-publication.entity';
import { PagePublicationOrmEntity } from '../entities/page-publication.orm-entity';

export class PagePublicationMapper {
  static toDomain(orm: PagePublicationOrmEntity): PagePublication {
    return PagePublication.restore({
      id: orm.id,
      siteId: orm.site_id,
      pageId: orm.page_id,
      path: orm.path,
      publishedBy: orm.published_by,
      publishedAt: orm.published_at,
      unpublishedAt: orm.unpublished_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: PagePublication): PagePublicationOrmEntity {
    const orm = new PagePublicationOrmEntity();
    orm.id = domain.getId();
    orm.site_id = domain.getSiteId();
    orm.page_id = domain.getPageId();
    orm.path = domain.getPath();
    orm.published_by = domain.getPublishedBy();
    orm.published_at = domain.getPublishedAt();
    orm.unpublished_at = domain.getUnpublishedAt();
    orm.updated_at = domain.getUpdatedAt();
    return orm;
  }
}
