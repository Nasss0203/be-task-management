export const CONTENT_TYPES = {
  ports: {
    PageProvisioning: Symbol.for('PageProvisioning'),
  },
  applications: {
    CreatePageHandler: Symbol.for('CreatePageHandler'),
    FindPageHandler: Symbol.for('FindPageHandler'),
    UpdatePageHandler: Symbol.for('UpdatePageHandler'),
    DeletePageHandler: Symbol.for('DeletePageHandler'),

    CreatePageBlockHandler: Symbol.for('CreatePageBlockHandler'),
    FindPageBlockHandler: Symbol.for('FindPageBlockHandler'),
    UpdatePageBlockHandler: Symbol.for('UpdatePageBlockHandler'),
    ReorderPageBlockHandler: Symbol.for('ReorderPageBlockHandler'),
    MovePageBlockHandler: Symbol.for('MovePageBlockHandler'),
    DeletePageBlockHandler: Symbol.for('DeletePageBlockHandler'),

    CreatePageTemplateHandler: Symbol.for('CreatePageTemplateHandler'),
    FindPageTemplateHandler: Symbol.for('FindPageTemplateHandler'),
    UpdatePageTemplateHandler: Symbol.for('UpdatePageTemplateHandler'),
    DeletePageTemplateHandler: Symbol.for('DeletePageTemplateHandler'),

    CreatePageTemplateBlockHandler: Symbol.for(
      'CreatePageTemplateBlockHandler',
    ),
    FindPageTemplateBlockHandler: Symbol.for('FindPageTemplateBlockHandler'),
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
