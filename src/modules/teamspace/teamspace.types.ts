export const TEAMSPACE_TYPES = {
  repositories: {
    TeamspaceRepository: Symbol('TeamspaceRepository'),
    TeamspaceMemberRepository: Symbol('TeamspaceMemberRepository'),
    TeamspaceInvitationRepository: Symbol('TeamspaceInvitationRepository'),
    TeamspaceInviteLinkRepository: Symbol('TeamspaceInviteLinkRepository'),
  },
  applications: {
    CreateTeamspaceHandler: Symbol('CreateTeamspaceHandler'),
    AddTeamspaceMemberHandler: Symbol('AddTeamspaceMemberHandler'),
    UpdateTeamspaceMemberRoleHandler: Symbol(
      'UpdateTeamspaceMemberRoleHandler',
    ),
    RemoveTeamspaceMemberHandler: Symbol('RemoveTeamspaceMemberHandler'),
    LeaveTeamspaceHandler: Symbol('LeaveTeamspaceHandler'),
    InviteTeamspaceMemberHandler: Symbol('InviteTeamspaceMemberHandler'),
    AcceptTeamspaceInvitationHandler: Symbol('AcceptTeamspaceInvitationHandler'),
    DeclineTeamspaceInvitationHandler: Symbol('DeclineTeamspaceInvitationHandler'),
    GetMyTeamspaceInvitationsHandler: Symbol('GetMyTeamspaceInvitationsHandler'),
    CreateTeamspaceInviteLinkHandler: Symbol('CreateTeamspaceInviteLinkHandler'),
    JoinTeamspaceByLinkHandler: Symbol('JoinTeamspaceByLinkHandler'),
    RevokeTeamspaceInviteLinkHandler: Symbol('RevokeTeamspaceInviteLinkHandler'),
    ListTeamspaceInviteLinksHandler: Symbol('ListTeamspaceInviteLinksHandler'),
    JoinTeamspaceHandler: Symbol('JoinTeamspaceHandler'),
    DiscoverTeamspacesHandler: Symbol('DiscoverTeamspacesHandler'),
    UpdateTeamspaceJoinSettingsHandler: Symbol('UpdateTeamspaceJoinSettingsHandler'),
    GetTeamspacesHandler: Symbol('GetTeamspacesHandler'),
    GetTeamspaceMembersHandler: Symbol('GetTeamspaceMembersHandler'),
  },
  ports: {
    // TS-1.2
    TeamspaceMembershipLock: Symbol('TeamspaceMembershipLock'),
  },
} as const;
