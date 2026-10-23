export const TEAMSPACE_TYPES = {
  repositories: {
    TeamspaceRepository: Symbol('TeamspaceRepository'),
    TeamspaceMemberRepository: Symbol('TeamspaceMemberRepository'),
  },
  applications: {
    CreateTeamspaceHandler: Symbol('CreateTeamspaceHandler'),
    AddTeamspaceMemberHandler: Symbol('AddTeamspaceMemberHandler'),
    UpdateTeamspaceMemberRoleHandler: Symbol(
      'UpdateTeamspaceMemberRoleHandler',
    ),
    RemoveTeamspaceMemberHandler: Symbol('RemoveTeamspaceMemberHandler'),
    GetTeamspacesHandler: Symbol('GetTeamspacesHandler'),
    GetTeamspaceMembersHandler: Symbol('GetTeamspaceMembersHandler'),
  },
  ports: {
    // TS-1.2
    TeamspaceMembershipLock: Symbol('TeamspaceMembershipLock'),
  },
} as const;
