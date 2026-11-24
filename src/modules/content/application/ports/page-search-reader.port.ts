export interface PageSearchRow {
  pageId: string;
  title: string;
  icon: string | null;
  teamspaceId: string | null;
  parentPageId: string | null;
  updatedAt: Date;
  matchedInTitle: boolean;
  snippet: string | null;
}

export interface PageSearchFilters {
  createdBy?: string;
  teamspaceId?: string | null;
  editedWithinDays?: number;
}

export interface PageSearchReader {
  search(input: {
    workspaceId: string;
    userId: string;
    normalizedQuery: string;
    limit: number;
    filters?: PageSearchFilters;
  }): Promise<PageSearchRow[]>;
}
