import { PageShareAccessLevel } from '../../domain/policies/page-share-permission.policy';

export interface EffectivePageShare {
  shareId: string;
  sharedPageId: string;
  accessLevel: PageShareAccessLevel;
}

export interface PageSharePermissionReader {
  findEffectiveShare(
    pageId: string,
    userId: string,
  ): Promise<EffectivePageShare | null>;
}
