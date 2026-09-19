import { PageAccessRequest } from '../../../../domain/entities/page-access-request.entity';
import { PageAccessRequestOrmEntity } from '../entities/page-access-request.orm-entity';

export class PageAccessRequestMapper {
  static toDomain(orm: PageAccessRequestOrmEntity): PageAccessRequest {
    return PageAccessRequest.restore({
      id: orm.id,
      pageId: orm.page_id,
      userId: orm.user_id,
      status: orm.status,
      reviewedBy: orm.reviewed_by,
      reviewedAt: orm.reviewed_at,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: PageAccessRequest): PageAccessRequestOrmEntity {
    const orm = new PageAccessRequestOrmEntity();

    orm.id = domain.getId();
    orm.page_id = domain.getPageId();
    orm.user_id = domain.getUserId();
    orm.status = domain.getStatus();
    orm.reviewed_by = domain.getReviewedBy();
    orm.reviewed_at = domain.getReviewedAt();
    orm.created_at = domain.getCreatedAt();
    orm.updated_at = domain.getUpdatedAt();

    return orm;
  }
}
