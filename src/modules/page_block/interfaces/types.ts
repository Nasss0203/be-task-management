export const PAGE_BLOCK_TYPES = {
  services: {
    CreatePageBlockService: 'CreatePageBlockService',
    UpdatePageBlockService: 'UpdatePageBlockService',
    FindPageBlockService: 'FindPageBlockService',
    DeletePageBlockService: 'DeletePageBlockService',
  },
  applications: {
    CreatePageBlockApplication: 'CreatePageBlockApplication',
    UpdatePageBlockApplication: 'UpdatePageBlockApplication',
    DeletePageBlockApplication: 'DeletePageBlockApplication',
    FindPageBlockApplication: 'FindPageBlockApplication',
  },
  repositories: {
    CreatePageBlockRepository: 'CreatePageBlockRepository',
    UpdatePageBlockRepository: 'UpdatePageBlockRepository',
    FindPageBlockRepository: 'FindPageBlockRepository',
    DeletePageBlockRepository: 'DeletePageBlockRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
} as const;
