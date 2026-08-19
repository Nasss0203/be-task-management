export const WORKSPACE_TYPES = {
  repositories: {
    WorkspaceRepository: Symbol('WorkspaceRepository'),
    WorkspaceMemberRepository: Symbol('WorkspaceMemberRepository'),
    WorkspaceInviteRepository: Symbol('WorkspaceInviteRepository'),
  },
} as const;
