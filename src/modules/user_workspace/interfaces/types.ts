export const USER_WORKSPACE_TYPES = {
  services: {
    CreateUserWorkspaceService: 'CreateUserWorkspaceService',
    AddMemberWorkspaceService: 'AddMemberWorkspaceService',
    FindAllMemberService: 'FindAllMemberService',
  },
  applications: {
    CreateUserWorkspaceApplication: 'CreateUserWorkspaceApplication',
    AddWorkspaceMemberApplication: 'AddWorkspaceMemberApplication',
    FindAllMemberApplication: 'FindAllMemberApplication',
  },
  repositories: {
    UserWorkspaceRepository: 'IUserWorkspaceRepository',
    FindUserWorkspaceRepository: 'FindUserWorkspaceRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
