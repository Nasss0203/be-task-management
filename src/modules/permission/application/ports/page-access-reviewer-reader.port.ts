export interface PageAccessReviewerReader {
  findReviewerIds(pageId: string): Promise<string[]>;
}
