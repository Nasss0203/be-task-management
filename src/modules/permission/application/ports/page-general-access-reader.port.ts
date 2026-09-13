import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

export interface PageGeneralAccessContext {
  workspaceAccessLevel: ResourceAccessLevel | null;

  linkAccessLevel: ResourceAccessLevel | null;
}

export interface PageGeneralAccessReader {
  findByPageId(pageId: string): Promise<PageGeneralAccessContext | null>;
}
