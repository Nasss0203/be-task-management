import { PageShareLink } from '../../../../domain/entities/page-share-link.entity';

import { PageShareLinkOrmEntity } from '../entities/page-share-link.orm-entity';

export class PageShareLinkMapper {
  static toDomain(orm: PageShareLinkOrmEntity): PageShareLink {
    return PageShareLink.restore({
      id: orm.id,
      pageId: orm.page_id,
      tokenHash: orm.token_hash,
      accessLevel: orm.access_level,
      createdBy: orm.created_by,
      expiresAt: orm.expires_at,
      revokedAt: orm.revoked_at,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: PageShareLink): PageShareLinkOrmEntity {
    const orm = new PageShareLinkOrmEntity();

    orm.id = domain.getId();
    orm.page_id = domain.getPageId();
    orm.token_hash = domain.getTokenHash();
    orm.access_level = domain.getAccessLevel();
    orm.created_by = domain.getCreatedBy();
    orm.expires_at = domain.getExpiresAt();
    orm.revoked_at = domain.getRevokedAt();
    orm.created_at = domain.getCreatedAt();
    orm.updated_at = domain.getUpdatedAt();

    return orm;
  }
}
