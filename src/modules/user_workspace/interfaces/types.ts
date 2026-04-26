export const USER_WORKSPACE_TYPES = {
  services: {
    CreateUserWorkspaceService: 'CreateUserWorkspaceService',
    AddMemberWorkspaceService: 'AddMemberWorkspaceService',
    FindMemberService: 'FindMemberService',
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
