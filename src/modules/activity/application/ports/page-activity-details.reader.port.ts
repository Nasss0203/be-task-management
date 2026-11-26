export type ActivityTargetRequest = {
  rowIds: string[];
  propertyIds: string[];
  optionIds: string[];
  userIds: string[];
};

export type ActivityTargetNames = {
  rowTitles: Map<string, string>;
  properties: Map<string, { name: string; type: string }>;
  options: Map<string, { name: string; color: string | null }>;
  users: Map<string, string | null>;
};

export type ActivityPageSummary = {
  id: string;
  title: string;
  icon: string | null;
};

export type PageCreation = {
  createdBy: string | null;
  createdAt: Date;
};

export interface PageActivityDetailsReader {
  findNames(request: ActivityTargetRequest): Promise<ActivityTargetNames>;

  findPageCreation(pageId: string): Promise<PageCreation | null>;

  findPages(pageIds: string[]): Promise<Map<string, ActivityPageSummary>>;
}
