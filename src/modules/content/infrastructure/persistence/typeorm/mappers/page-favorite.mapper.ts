import { PageFavorite } from 'src/modules/content/domain/entities/page-favorite.entity';

import { PageFavoriteOrmEntity } from '../entities/page-favorite.orm-entity';

export class PageFavoriteMapper {
  static toDomain(entity: PageFavoriteOrmEntity): PageFavorite {
    return PageFavorite.restore({
      id: entity.id,
      userId: entity.user_id,
      pageId: entity.page_id,
      createdAt: entity.created_at,
    });
  }

  static toOrm(favorite: PageFavorite): PageFavoriteOrmEntity {
    const entity = new PageFavoriteOrmEntity();

    entity.id = favorite.getId();
    entity.user_id = favorite.getUserId();
    entity.page_id = favorite.getPageId();
    entity.created_at = favorite.getCreatedAt();

    return entity;
  }
}
