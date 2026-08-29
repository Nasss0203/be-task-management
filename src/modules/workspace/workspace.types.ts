export const WORKSPACE_TYPES = {
  repositories: {
    WorkspaceRepository: Symbol('WorkspaceRepository'),
    WorkspaceMemberRepository: Symbol('WorkspaceMemberRepository'),
    WorkspaceInviteRepository: Symbol('WorkspaceInviteRepository'),
    TeamspaceRepository: Symbol('TeamspaceRepository'),
    TeamspaceMemberRepository: Symbol('TeamspaceMemberRepository'),
  },
} as const;
