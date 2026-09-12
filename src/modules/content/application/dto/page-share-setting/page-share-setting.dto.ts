import { PageGeneralAccess } from '../../../domain/constants/page-general-access.constant';
import { ResourceAccessLevel } from '../../../domain/constants/resource-access-level.constant';
import { PageShareSetting } from '../../../domain/entities/page-share-setting.entity';

export class PageShareSettingDto {
  generalAccess: PageGeneralAccess;

  linkAccessLevel: ResourceAccessLevel;

  static fromDomain(setting: PageShareSetting): PageShareSettingDto {
    return {
      generalAccess: setting.getGeneralAccess(),

      linkAccessLevel: setting.getLinkAccessLevel(),
    };
  }

  static restricted(): PageShareSettingDto {
    return {
      generalAccess: PageGeneralAccess.RESTRICTED,

      linkAccessLevel: ResourceAccessLevel.VIEWER,
    };
  }
}
