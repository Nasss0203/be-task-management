import { PageEditRequest } from '../../../../domain/entities/page-edit-request.entity';

import { PageEditRequestOrmEntity } from '../entities/page-edit-request.orm-entity';

export class PageEditRequestMapper {
  static toDomain(orm: PageEditRequestOrmEntity): PageEditRequest {
    return PageEditRequest.restore({
      id: orm.id,

      pageId: orm.page_id,

      pageShareId: orm.page_share_id,

      userId: orm.user_id,

      status: orm.status,

      reviewedBy: orm.reviewed_by,

      reviewedAt: orm.reviewed_at,

      createdAt: orm.created_at,

      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: PageEditRequest): PageEditRequestOrmEntity {
    const orm = new PageEditRequestOrmEntity();

    orm.id = domain.getId();

    orm.page_id = domain.getPageId();

    orm.page_share_id = domain.getPageShareId();

    orm.user_id = domain.getUserId();

    orm.status = domain.getStatus();

    orm.reviewed_by = domain.getReviewedBy();

    orm.reviewed_at = domain.getReviewedAt();

    orm.created_at = domain.getCreatedAt();

    orm.updated_at = domain.getUpdatedAt();

    return orm;
  }
}
