export type PageGeneralAccess = 'RESTRICTED' | 'LINK';

export type PageLinkAccessLevel = 'VIEWER' | 'EDITOR';

export interface PageGeneralAccessContext {
  generalAccess: PageGeneralAccess;

  linkAccessLevel: PageLinkAccessLevel;
}

export interface PageGeneralAccessReader {
  findByPageId(pageId: string): Promise<PageGeneralAccessContext | null>;
}
