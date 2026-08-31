export interface ResourceAuthorizationContext {
  workspaceId: string;
  teamspaceId: string | null;
}

export interface ResourceAuthorizationReader {
  findPageContext(pageId: string): Promise<ResourceAuthorizationContext | null>;

  findPageBlockContext(
    blockId: string,
  ): Promise<ResourceAuthorizationContext | null>;
}
