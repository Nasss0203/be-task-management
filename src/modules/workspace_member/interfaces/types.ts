export const WORKSPACE_MEMBER_TYPES = {
  services: {
    CreateWorkspaceMemberService: 'CreateWorkspaceMemberService',
    AddWorkspaceMemberService: 'AddWorkspaceMemberService',
    FindWorkspaceMemberService: 'FindWorkspaceMemberService',
    UpdateWorkspaceMemberService: 'UpdateWorkspaceMemberService',
    DeleteWorkspaceMemberService: 'DeleteWorkspaceMemberService',
  },
  repositories: {
    WorkspaceMemberRepository: 'IWorkspaceMemberRepository',
    FindWorkspaceMemberRepository: 'FindWorkspaceMemberRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
