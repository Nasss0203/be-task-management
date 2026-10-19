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
    TemplateAnalyticsEventRepository: Symbol(
      'TemplateAnalyticsEventRepository',
    ),
    MarketplaceCommissionRateRepository: Symbol(
      'MarketplaceCommissionRateRepository',
    ),
    TemplateReviewRepository: Symbol('TemplateReviewRepository'),
    TemplateLikeRepository: Symbol('TemplateLikeRepository'),
    CreatorProfileRepository: Symbol('CreatorProfileRepository'),
  },
  applications: {
    GetTemplatePurchaseHandler: Symbol('GetTemplatePurchaseHandler'),
    GetMyTemplatePurchasesHandler: Symbol('GetMyTemplatePurchasesHandler'),
    ResolveTemplatePurchaseReconciliationHandler: Symbol(
      'ResolveTemplatePurchaseReconciliationHandler',
    ),
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
    PreviewTemplateDemoHandler: Symbol('PreviewTemplateDemoHandler'),
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
    RecordTemplateViewHandler: Symbol('RecordTemplateViewHandler'),
    ListCreatorTemplateAnalyticsHandler: Symbol(
      'ListCreatorTemplateAnalyticsHandler',
    ),
    GetCreatorTemplateAnalyticsHandler: Symbol(
      'GetCreatorTemplateAnalyticsHandler',
    ),
    GetMarketplaceCommissionRateHandler: Symbol(
      'GetMarketplaceCommissionRateHandler',
    ),
    UpdateMarketplaceCommissionRateHandler: Symbol(
      'UpdateMarketplaceCommissionRateHandler',
    ),
    UpsertTemplateReviewHandler: Symbol('UpsertTemplateReviewHandler'),
    DeleteTemplateReviewHandler: Symbol('DeleteTemplateReviewHandler'),
    SetTemplateLikeHandler: Symbol('SetTemplateLikeHandler'),
    ListPublicTemplateReviewsHandler: Symbol(
      'ListPublicTemplateReviewsHandler',
    ),
    GetPublicCreatorProfileHandler: Symbol('GetPublicCreatorProfileHandler'),
    GetMyCreatorProfileHandler: Symbol('GetMyCreatorProfileHandler'),
    UpsertMyCreatorProfileHandler: Symbol('UpsertMyCreatorProfileHandler'),
    SetCreatorImageHandler: Symbol('SetCreatorImageHandler'),
  },
  ports: {
    Distribution: Symbol('TemplateDistributionPort'),
    Entitlements: Symbol('TemplateEntitlementPort'),
    FreeClaims: Symbol('TemplateFreeClaimPort'),
    CreatorReader: Symbol('TemplateCreatorReader'),
    AnalyticsReader: Symbol('TemplateAnalyticsReader'),
    CommissionRateReader: Symbol('MarketplaceCommissionRateReader'),
    FeedbackReader: Symbol('TemplateFeedbackReader'),
    CreatorProfileReader: Symbol('CreatorProfileReader'),
  },
  services: {
    TemplatePurchaseSettlementService: Symbol(
      'TemplatePurchaseSettlementService',
    ),
    TemplatePurchaseEligibilityService: Symbol(
      'TemplatePurchaseEligibilityService',
    ),
  },
} as const;
