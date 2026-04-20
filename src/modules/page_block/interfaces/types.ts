export const PAGE_BLOCK_TYPES = {
  services: {
    CreatePageBlockService: 'CreatePageBlockService',
    UpdatePageBlockService: 'UpdatePageBlockService',
    FindPageBlockService: 'FindPageBlockService',
  },
  applications: {
    CreatePageBlockApplication: 'CreatePageBlockApplication',
    UpdatePageBlockApplication: 'UpdatePageBlockApplication',
  },
  repositories: {
    CreatePageBlockRepository: 'CreatePageBlockRepository',
    UpdatePageBlockRepository: 'UpdatePageBlockRepository',
    FindPageBlockRepository: 'FindPageBlockRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
} as const;
