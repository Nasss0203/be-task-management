export const CONTENT_TYPES = {
  ports: {
    PageProvisioning: Symbol.for('PageProvisioning'),
  },
  applications: {
    CreatePageHandler: Symbol.for('CreatePageHandler'),
    FindPageByWorkspaceHandler: Symbol.for('FindPageByWorkspaceHandler'),
    FindDeletedPagesHandler: Symbol.for('FindDeletedPagesHandler'),
    FindPageByIdHandler: Symbol.for('FindPageByIdHandler'),
    UpdatePageHandler: Symbol.for('UpdatePageHandler'),
    DeletePageHandler: Symbol.for('DeletePageHandler'),
    RestorePageHandler: Symbol.for('RestorePageHandler'),
    PermanentlyDeletePageHandler: Symbol.for('PermanentlyDeletePageHandler'),

    CreatePageBlockHandler: Symbol.for('CreatePageBlockHandler'),
    AddDatabaseViewToBlockHandler: Symbol.for('AddDatabaseViewToBlockHandler'),
    FindPageBlockByPageHandler: Symbol.for('FindPageBlockByPageHandler'),
    FindPageBlockByIdHandler: Symbol.for('FindPageBlockByIdHandler'),
    FindDeletedPageBlocksHandler: Symbol.for('FindDeletedPageBlocksHandler'),
    UpdatePageBlockHandler: Symbol.for('UpdatePageBlockHandler'),
    ReorderPageBlockHandler: Symbol.for('ReorderPageBlockHandler'),
    MovePageBlockHandler: Symbol.for('MovePageBlockHandler'),
    DeletePageBlockHandler: Symbol.for('DeletePageBlockHandler'),
    RestorePageBlockHandler: Symbol.for('RestorePageBlockHandler'),

    CreatePageTemplateHandler: Symbol.for('CreatePageTemplateHandler'),
    FindPageTemplateHandler: Symbol.for('FindPageTemplateHandler'),
    UpdatePageTemplateHandler: Symbol.for('UpdatePageTemplateHandler'),
    DeletePageTemplateHandler: Symbol.for('DeletePageTemplateHandler'),

    CreatePageTemplateBlockHandler: Symbol.for(
      'CreatePageTemplateBlockHandler',
    ),
    FindPageTemplateBlockByTemplateHandler: Symbol.for(
      'FindPageTemplateBlockByTemplateHandler',
    ),
    UpdatePageTemplateBlockHandler: Symbol.for(
      'UpdatePageTemplateBlockHandler',
    ),
    DeletePageTemplateBlockHandler: Symbol.for(
      'DeletePageTemplateBlockHandler',
    ),
  },
  repositories: {
    PageRepository: Symbol.for('PageRepository'),
    PageBlockRepository: Symbol.for('PageBlockRepository'),
    PageTemplateRepository: Symbol.for('PageTemplateRepository'),
    PageTemplateBlockRepository: Symbol.for('PageTemplateBlockRepository'),
  },
  bookmarkMetadataFetcher: Symbol('BookmarkMetadataFetcher'),
};
