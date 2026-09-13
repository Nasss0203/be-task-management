import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

export interface EffectivePageShare {
  shareId: string;

  sharedPageId: string;

  accessLevel: ResourceAccessLevel;
}

export interface PageSharePermissionReader {
  findEffectiveShare(
    pageId: string,
    userId: string,
  ): Promise<EffectivePageShare | null>;
}
