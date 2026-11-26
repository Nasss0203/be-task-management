export interface PageVisitRecord {
  userId: string;
  pageId: string;
  workspaceId: string;
  visitedAt: Date;
}

export interface PageVisitRepository {
  record(visit: PageVisitRecord): Promise<void>;
}
