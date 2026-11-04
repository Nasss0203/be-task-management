export interface MentionCandidate {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

/** Workspace và teamspace (nếu có) của page; quyết định ai được mention. */
export interface MentionPageScope {
  workspaceId: string;
  teamspaceId: string | null;
}

export interface MentionCandidateReader {
  findPageScope(pageId: string): Promise<MentionPageScope | null>;

  /**
   * Thành viên (không gồm guest) của teamspace nếu page thuộc teamspace,
   * ngược lại của workspace. Lọc theo `query` (tên / email) hoặc `userIds`.
   */
  findMembers(input: {
    scope: MentionPageScope;
    query?: string;
    userIds?: string[];
    limit: number;
  }): Promise<MentionCandidate[]>;
}
