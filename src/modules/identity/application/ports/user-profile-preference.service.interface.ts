export interface UserProfilePreferenceService {
  updateLastActiveWorkspace(
    userId: string,
    workspaceId: string | null,
  ): Promise<void>;
}
