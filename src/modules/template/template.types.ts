export const TEMPLATE_TYPES = {
  repositories: {
    PageTemplateRepository: Symbol('PageTemplateRepository'),
    TemplateVersionRepository: Symbol('TemplateVersionRepository'),
    PageTemplateBlockRepository: Symbol('PageTemplateBlockRepository'),
    PageTemplateDatabaseSnapshotRepository: Symbol(
      'PageTemplateDatabaseSnapshotRepository',
    ),
    TemplateVersionAssetRepository: Symbol('TemplateVersionAssetRepository'),
    TemplateListingRepository: Symbol('TemplateListingRepository'),
    TemplateEntitlementRepository: Symbol('TemplateEntitlementRepository'),
  },

  applications: {
    GetMyClaimedTemplatesHandler: Symbol('GetMyClaimedTemplatesHandler'),
    PublishTemplateToMarketplaceHandler: Symbol(
      'PublishTemplateToMarketplaceHandler',
    ),
    ClaimFreeTemplateHandler: Symbol('ClaimFreeTemplateHandler'),
    CreateTemplateListingHandler: Symbol('CreateTemplateListingHandler'),
    PublishTemplateListingHandler: Symbol('PublishTemplateListingHandler'),
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

    GetTemplateListingHandler: Symbol('GetTemplateListingHandler'),
    UnpublishTemplateListingHandler: Symbol('UnpublishTemplateListingHandler'),
  },
  services: {
    TemplateThumbnailRenderer: Symbol('TemplateThumbnailRenderer'),
    TemplateThumbnailJobQueue: Symbol('TemplateThumbnailJobQueue'),
  },
} as const;
