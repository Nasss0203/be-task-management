export const TEAMSPACE_TYPES = {
  repositories: {
    TeamspaceRepository: Symbol('TeamspaceRepository'),
    TeamspaceMemberRepository: Symbol('TeamspaceMemberRepository'),
  },
  applications: {
    CreateTeamspaceHandler: Symbol('CreateTeamspaceHandler'),
    GetTeamspacesHandler: Symbol('GetTeamspacesHandler'),
    AddTeamspaceMemberHandler: Symbol('AddTeamspaceMemberHandler'),
    GetTeamspaceMembersHandler: Symbol('GetTeamspaceMembersHandler'),
  },
} as const;
