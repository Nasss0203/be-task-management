export const WORKSPACE_TYPES = {
  repositories: {
    WorkspaceRepository: Symbol('WorkspaceRepository'),
    WorkspaceMemberRepository: Symbol('WorkspaceMemberRepository'),
    WorkspaceInviteRepository: Symbol('WorkspaceInviteRepository'),
  },
  ports: {
    TeamspaceOwnershipGuard: Symbol('TeamspaceOwnershipGuard'),
  },
  applications: {
    CreateDefaultWorkspaceHandler: Symbol('CreateDefaultWorkspaceHandler'),
    CreateWorkspaceHandler: Symbol('CreateWorkspaceHandler'),
    ListWorkspacesHandler: Symbol('ListWorkspacesHandler'),
    ListWorkspaceStartersHandler: Symbol('ListWorkspaceStartersHandler'),
    GetWorkspaceHandler: Symbol('GetWorkspaceHandler'),
    GetWorkspaceAccessHandler: Symbol('GetWorkspaceAccessHandler'),
    ListDeletedWorkspacesHandler: Symbol('ListDeletedWorkspacesHandler'),
    GetWorkspaceOverviewHandler: Symbol('GetWorkspaceOverviewHandler'),
    UpdateWorkspaceHandler: Symbol('UpdateWorkspaceHandler'),
    UpdateWorkspaceLayoutModeHandler: Symbol(
      'UpdateWorkspaceLayoutModeHandler',
    ),
    SoftDeleteWorkspaceHandler: Symbol('SoftDeleteWorkspaceHandler'),
    RestoreWorkspaceHandler: Symbol('RestoreWorkspaceHandler'),
    RemoveWorkspaceFromTrashHandler: Symbol('RemoveWorkspaceFromTrashHandler'),
    SelectWorkspaceHandler: Symbol('SelectWorkspaceHandler'),
    InviteWorkspaceMemberHandler: Symbol('InviteWorkspaceMemberHandler'),
    AcceptWorkspaceInviteHandler: Symbol('AcceptWorkspaceInviteHandler'),
    DeclineWorkspaceInviteHandler: Symbol('DeclineWorkspaceInviteHandler'),
    CreateWorkspaceInviteLinkHandler: Symbol(
      'CreateWorkspaceInviteLinkHandler',
    ),
    SearchInviteUsersHandler: Symbol('SearchInviteUsersHandler'),
    RevokeWorkspaceInviteHandler: Symbol('RevokeWorkspaceInviteHandler'),
    ResendWorkspaceInviteHandler: Symbol('ResendWorkspaceInviteHandler'),
    GetPendingWorkspaceInvitesHandler: Symbol(
      'GetPendingWorkspaceInvitesHandler',
    ),
    AddWorkspaceMemberHandler: Symbol('AddWorkspaceMemberHandler'),
    UpdateWorkspaceMemberRoleHandler: Symbol(
      'UpdateWorkspaceMemberRoleHandler',
    ),
    DeleteWorkspaceMemberHandler: Symbol('DeleteWorkspaceMemberHandler'),
    ListWorkspaceMembersHandler: Symbol('ListWorkspaceMembersHandler'),
    ListWorkspacePeopleHandler: Symbol('ListWorkspacePeopleHandler'),
  },
} as const;
