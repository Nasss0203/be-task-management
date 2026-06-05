export const PAGE_TYPES = {
  services: {
    CreatePageService: 'CreatePageService',
    FindPageService: 'FindPageService',
    UpdatePageService: 'UpdatePageService',
    DeletePageService: 'DeletePageService',
  },
  applications: {
    CreatePageApplication: 'CreatePageApplication',
    FindPageApplication: 'FindPageApplication',
    UpdatePageApplication: 'UpdatePageApplication',
    DeletePageApplication: 'DeletePageApplication',
  },
  repositories: {
    PageRepository: 'IPageRepository',
    FindPageRepository: 'FindPageRepository',
    UpdatePageRepository: 'UpdatePageRepository',
    DeletePageRepository: 'DeletePageRepository',
  },
  uow: {
    UnitOfWork: 'PageUnitOfWork',
  },
};
