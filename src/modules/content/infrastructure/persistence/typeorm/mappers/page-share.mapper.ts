import { PageShare } from '../../../../domain/entities/page-share.entity';

import { PageShareOrmEntity } from '../entities/page-share.orm-entity';

export class PageShareMapper {
  static toDomain(orm: PageShareOrmEntity): PageShare {
    return PageShare.restore({
      id: orm.id,

      pageId: orm.page_id,

      userId: orm.user_id,

      shareLinkId: orm.share_link_id,

      accessLevel: orm.access_level,

      createdBy: orm.created_by,

      createdAt: orm.created_at,

      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: PageShare): PageShareOrmEntity {
    const orm = new PageShareOrmEntity();

    orm.id = domain.getId();

    orm.page_id = domain.getPageId();

    orm.user_id = domain.getUserId();

    orm.share_link_id = domain.getShareLinkId();

    orm.access_level = domain.getAccessLevel();

    orm.created_by = domain.getCreatedBy();

    orm.created_at = domain.getCreatedAt();

    orm.updated_at = domain.getUpdatedAt();

    return orm;
  }
}
