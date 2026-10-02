export const TEMPLATE_TYPES = {
  repositories: {
    PageTemplateRepository: Symbol('PageTemplateRepository'),
    TemplateVersionRepository: Symbol('TemplateVersionRepository'),
    PageTemplateBlockRepository: Symbol('PageTemplateBlockRepository'),
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
    GetTemplateVersionBlocksHandler: Symbol('GetTemplateVersionBlocksHandler'),
    GetTemplatePreviewHandler: Symbol('GetTemplatePreviewHandler'),
    UseTemplateHandler: Symbol('UseTemplateHandler'),
  },
} as const;
