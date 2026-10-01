export interface PublicSiteNavigationRow {
  publicationId: string;
  pageId: string;
  path: string;
  parentPublicationId: string | null;
  unpublishedAt: Date | null;
  title: string;
  icon: string | null;
}

export interface PublicSiteNavigationReader {
  listBySiteId(siteId: string): Promise<PublicSiteNavigationRow[]>;
}
