import { ResourceAccessLevel } from '../../../domain/constants/resource-access-level.constant';
import { PageShareSetting } from '../../../domain/entities/page-share-setting.entity';

export class PageShareSettingDto {
  workspaceAccessLevel: ResourceAccessLevel | null;

  linkAccessLevel: ResourceAccessLevel | null;

  static fromDomain(setting: PageShareSetting): PageShareSettingDto {
    return {
      workspaceAccessLevel: setting.getWorkspaceAccessLevel(),

      linkAccessLevel: setting.getLinkAccessLevel(),
    };
  }

  static restricted(): PageShareSettingDto {
    return {
      workspaceAccessLevel: null,
      linkAccessLevel: null,
    };
  }
}
