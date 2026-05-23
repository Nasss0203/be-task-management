export const getUserRoomName = (userId: string) => `user:${userId}`;

export const getWorkspaceRoomName = (workspaceId: string) =>
  `workspace:${workspaceId}`;

export const getProjectRoomName = (projectId: string) => `project:${projectId}`;
