export interface SiteThemeImage {
  id: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface SiteThemeImageReader {
  findReadyImages(
    workspaceId: string,
    attachmentIds: string[],
  ): Promise<SiteThemeImage[]>;
}
