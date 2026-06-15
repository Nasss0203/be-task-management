export const USER_WORKSPACE_TYPES = {
  services: {
    CreateUserWorkspaceService: 'CreateUserWorkspaceService',
    AddMemberWorkspaceService: 'AddMemberWorkspaceService',
    FindMemberService: 'FindMemberService',
    UpdateMemberWorkspaceService: 'UpdateMemberWorkspaceService',
    DeleteMemberWorkspaceService: 'DeleteMemberWorkspaceService',
  },
  applications: {
    CreateUserWorkspaceApplication: 'CreateUserWorkspaceApplication',
    AddWorkspaceMemberApplication: 'AddWorkspaceMemberApplication',
    FindAllMemberApplication: 'FindAllMemberApplication',
    UpdateMemberWorkspaceApplication: 'UpdateMemberWorkspaceApplication',
    DeleteMemberWorkspaceApplication: 'DeleteMemberWorkspaceApplication',
  },
  repositories: {
    UserWorkspaceRepository: 'IUserWorkspaceRepository',
    FindUserWorkspaceRepository: 'FindUserWorkspaceRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
