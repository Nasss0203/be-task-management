export const TEMPLATE_TYPES = {
  repositories: {
    PageTemplateRepository: Symbol('PageTemplateRepository'),
    TemplateVersionRepository: Symbol('TemplateVersionRepository'),
    PageTemplateBlockRepository: Symbol('PageTemplateBlockRepository'),
    PageTemplateDatabaseSnapshotRepository: Symbol(
      'PageTemplateDatabaseSnapshotRepository',
    ),
    TemplateVersionAssetRepository: Symbol('TemplateVersionAssetRepository'),
  },

  applications: {
    CreatePageTemplateHandler: Symbol('CreatePageTemplateHandler'),
    UpdatePageTemplateHandler: Symbol('UpdatePageTemplateHandler'),

    ArchivePageTemplateHandler: Symbol('ArchivePageTemplateHandler'),
    RestorePageTemplateHandler: Symbol('RestorePageTemplateHandler'),
    CreateTemplateVersionHandler: Symbol('CreateTemplateVersionHandler'),
    ReplaceTemplateBlocksHandler: Symbol('ReplaceTemplateBlocksHandler'),
    PublishTemplateVersionHandler: Symbol('PublishTemplateVersionHandler'),
    GetPageTemplateHandler: Symbol('GetPageTemplateHandler'),
    GetTemplateVersionHandler: Symbol('GetTemplateVersionHandler'),
    ListTemplateVersionsHandler: Symbol('ListTemplateVersionsHandler'),
    GetTemplateVersionBlocksHandler: Symbol('GetTemplateVersionBlocksHandler'),
    GetTemplatePreviewHandler: Symbol('GetTemplatePreviewHandler'),
    GetInternalTemplateRenderHandler: Symbol(
      'GetInternalTemplateRenderHandler',
    ),
    UseTemplateHandler: Symbol('UseTemplateHandler'),
    ListPageTemplatesHandler: Symbol('ListPageTemplatesHandler'),
    ListPublicTemplatesHandler: Symbol('ListPublicTemplatesHandler'),
    GenerateTemplateVersionThumbnailHandler: Symbol(
      'GenerateTemplateVersionThumbnailHandler',
    ),
    GetTemplateVersionThumbnailHandler: Symbol(
      'GetTemplateVersionThumbnailHandler',
    ),
    GetPublicTemplatePreviewHandler: Symbol('GetPublicTemplatePreviewHandler'),
    GetPublicTemplateDetailHandler: Symbol('GetPublicTemplateDetailHandler'),
  },
  services: {
    TemplateThumbnailRenderer: Symbol('TemplateThumbnailRenderer'),
    TemplateThumbnailJobQueue: Symbol('TemplateThumbnailJobQueue'),
  },
} as const;
