export const MARKETPLACE_TYPES = {
  repositories: {
    TemplateListingRepository: Symbol('TemplateListingRepository'),
    TemplateEntitlementRepository: Symbol('TemplateEntitlementRepository'),
    TemplateCategoryRepository: Symbol('TemplateCategoryRepository'),
    TemplatePurchaseRepository: Symbol('TemplatePurchaseRepository'),
    TemplateMarketplaceReleaseRepository: Symbol(
      'TemplateMarketplaceReleaseRepository',
    ),
    MarketplaceWebhookEventRepository: Symbol(
      'MarketplaceWebhookEventRepository',
    ),
  },
  applications: {
    UpdateTemplateListingPricingHandler: Symbol(
      'UpdateTemplateListingPricingHandler',
    ),
    GetMyClaimedTemplatesHandler: Symbol('GetMyClaimedTemplatesHandler'),
    PublishTemplateToMarketplaceHandler: Symbol(
      'PublishTemplateToMarketplaceHandler',
    ),
    ClaimFreeTemplateHandler: Symbol('ClaimFreeTemplateHandler'),
    CreateTemplateListingHandler: Symbol('CreateTemplateListingHandler'),
    PublishTemplateListingHandler: Symbol('PublishTemplateListingHandler'),
    ListPublicTemplatesHandler: Symbol('ListPublicTemplatesHandler'),
    GetPublicTemplatePreviewHandler: Symbol('GetPublicTemplatePreviewHandler'),
    GetPublicTemplateDetailHandler: Symbol('GetPublicTemplateDetailHandler'),
    GetTemplateListingHandler: Symbol('GetTemplateListingHandler'),
    UnpublishTemplateListingHandler: Symbol('UnpublishTemplateListingHandler'),
    CreateTemplateCategoryHandler: Symbol('CreateTemplateCategoryHandler'),
    ListTemplateCategoriesHandler: Symbol('ListTemplateCategoriesHandler'),
    ListActiveTemplateCategoriesHandler: Symbol(
      'ListActiveTemplateCategoriesHandler',
    ),
    UpdateTemplateCategoryHandler: Symbol('UpdateTemplateCategoryHandler'),
    ChangeTemplateCategoryStatusHandler: Symbol(
      'ChangeTemplateCategoryStatusHandler',
    ),
    CreateTemplatePurchaseHandler: Symbol('CreateTemplatePurchaseHandler'),
    CreateTemplatePurchaseCheckoutHandler: Symbol(
      'CreateTemplatePurchaseCheckoutHandler',
    ),
    ProcessMarketplaceStripeWebhookHandler: Symbol(
      'ProcessMarketplaceStripeWebhookHandler',
    ),
  },
  ports: {
    Distribution: Symbol('TemplateDistributionPort'),
    Entitlements: Symbol('TemplateEntitlementPort'),
  },
  services: {
    TemplatePurchaseSettlementService: Symbol(
      'TemplatePurchaseSettlementService',
    ),
  },
} as const;
