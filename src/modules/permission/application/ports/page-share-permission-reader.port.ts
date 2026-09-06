import type { PageShareAccessLevel } from '../../domain/policies/page-share-permission.policy';

export interface PageSharePermissionReader {
  findAccessLevel(
    pageId: string,
    userId: string,
  ): Promise<PageShareAccessLevel | null>;
}
