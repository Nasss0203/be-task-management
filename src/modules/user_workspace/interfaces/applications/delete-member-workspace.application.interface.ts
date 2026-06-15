export interface DeleteMemberWorkspaceApplication {
  deleteMember(
    workspaceId: string,
    userId: string,
    actorId: string,
  ): Promise<void>;
}
