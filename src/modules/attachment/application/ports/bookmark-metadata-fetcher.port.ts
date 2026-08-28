export interface BookmarkMetadata {
  url: string;
  title: string;
  description: string | null;
  siteName: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
}

export interface BookmarkMetadataFetcherPort {
  fetch(url: string): Promise<BookmarkMetadata>;
}
