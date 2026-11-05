export interface CalendarFeed {
  id: string;
  databaseId: string;
  datePropertyId: string;
  createdBy: string;
}

export interface CalendarFeedRepository {
  findActive(databaseId: string, userId: string): Promise<CalendarFeed | null>;
  findActiveById(id: string): Promise<CalendarFeed | null>;
  save(feed: CalendarFeed): Promise<void>;
  revoke(databaseId: string, userId: string): Promise<void>;
}
