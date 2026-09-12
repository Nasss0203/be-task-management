import { PageShareSetting } from '../../../../domain/entities/page-share-setting.entity';

import { PageShareSettingOrmEntity } from '../entities/page-share-setting.orm-entity';

export class PageShareSettingMapper {
  static toDomain(orm: PageShareSettingOrmEntity): PageShareSetting {
    return PageShareSetting.restore({
      id: orm.id,

      pageId: orm.page_id,

      generalAccess: orm.general_access,

      linkAccessLevel: orm.link_access_level,

      createdAt: orm.createdAt,

      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: PageShareSetting): PageShareSettingOrmEntity {
    const orm = new PageShareSettingOrmEntity();

    orm.id = domain.getId();

    orm.page_id = domain.getPageId();

    orm.general_access = domain.getGeneralAccess();

    orm.link_access_level = domain.getLinkAccessLevel();

    orm.createdAt = domain.getCreatedAt();

    orm.updatedAt = domain.getUpdatedAt();

    return orm;
  }
}
