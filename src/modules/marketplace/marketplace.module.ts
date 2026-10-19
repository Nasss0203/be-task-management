import { GetMyTemplatePurchasesHandler } from './application/queries/template-purchase/get-my-template-purchases/get-my-template-purchases.handler';
import { TypeOrmTemplateCreatorReader } from './infrastructure/persistence/typeorm/readers/typeorm-template-creator.reader';
import { TypeOrmTemplateAnalyticsReader } from './infrastructure/persistence/typeorm/readers/typeorm-template-analytics.reader';
import { TypeOrmMarketplaceCommissionRateReader } from './infrastructure/persistence/typeorm/readers/typeorm-marketplace-commission-rate.reader';
import { GetCreatorTemplateAnalyticsHandler } from './application/queries/template-analytics/get-creator-template-analytics/get-creator-template-analytics.handler';
import { ListCreatorTemplateAnalyticsHandler } from './application/queries/template-analytics/list-creator-template-analytics/list-creator-template-analytics.handler';
import { CreatorTemplateAnalyticsController } from './presentation/http/controllers/creator-template-analytics.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { PaymentModule } from '../payment/payment.module';
import { PermissionModule } from '../permission/permission.module';
import { TemplateContentModule } from '../template/template-content.module';
import { PublishTemplateToMarketplaceHandler } from './application/commands/publish-template-to-marketplace/publish-template-to-marketplace.handler';
import { CreateTemplateCategoryHandler } from './application/commands/template-category/create-template-category/create-template-category.handler';
import { UpdateTemplateCategoryHandler } from './application/commands/template-category/update-template-category/update-template-category.handler';
import { RecordTemplateViewHandler } from './application/commands/template-analytics/record-template-view/record-template-view.handler';
import { ClaimFreeTemplateHandler } from './application/commands/template-entitlement/claim-free-template/claim-free-template.handler';
import { FreeTemplateClaimService } from './application/services/free-template-claim.service';
import { CreateTemplateListingHandler } from './application/commands/template-listing/create-template-listing/create-template-listing.handler';
import { PublishTemplateListingHandler } from './application/commands/template-listing/publish-template-listing/publish-template-listing.handler';
import { UnpublishTemplateListingHandler } from './application/commands/template-listing/unpublish-template-listing/unpublish-template-listing.handler';
import { UpdateTemplateListingPricingHandler } from './application/commands/template-listing/update-template-listing-pricing/update-template-listing-pricing.handler';
import { ResolveTemplatePurchaseReconciliationHandler } from './application/commands/template-purchase/resolve-template-purchase-reconciliation/resolve-template-purchase-reconciliation.handler';
import { CreateTemplatePurchaseCheckoutHandler } from './application/commands/template-purchase/create-template-purchase-checkout/create-template-purchase-checkout.handler';
import { GetTemplatePurchaseHandler } from './application/queries/template-purchase/get-template-purchase/get-template-purchase.handler';
import { CreateTemplatePurchaseHandler } from './application/commands/template-purchase/create-template-purchase/create-template-purchase.handler';
import { ProcessMarketplaceStripeWebhookHandler } from './application/commands/template-purchase/process-stripe-webhook/process-marketplace-stripe-webhook.handler';
import { ListPublicTemplatesHandler } from './application/queries/page-template/list-public-templates/list-public-templates.handler';
import { ChangeTemplateCategoryStatusHandler } from './application/queries/template-category/change-template-category-status/change-template-category-status.handler';
import { ListActiveTemplateCategoriesHandler } from './application/queries/template-category/list-active-template-categories/list-active-template-categories.handler';
import { ListTemplateCategoriesHandler } from './application/queries/template-category/list-template-categories/list-template-categories.handler';
import { GetMyClaimedTemplatesHandler } from './application/queries/template-entitlement/get-my-claimed-templates/get-my-claimed-templates.handler';
import { GetTemplateListingHandler } from './application/queries/template-listing/get-template-listing/get-template-listing.handler';
import { GetPublicTemplateDetailHandler } from './application/queries/template-preview/get-public-template-detail/get-public-template-detail.handler';
import { GetPublicTemplatePreviewHandler } from './application/queries/template-preview/get-public-template-preview/get-public-template-preview.handler';
import { PreviewTemplateDemoHandler } from './application/queries/template-preview/preview-template-demo/preview-template-demo.handler';
import { TemplatePurchaseSettlementService } from './application/services/template-purchase-settlement.service';
import { TemplatePurchaseEligibilityService } from './application/services/template-purchase-eligibility.service';
import { TemplateCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/template-category.orm-entity';
import { TemplateEntitlementOrmEntity } from './infrastructure/persistence/typeorm/entities/template-entitlement.orm-entity';
import { TemplateListingCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/template-listing-category.orm-entity';
import { TemplateListingTagOrmEntity } from './infrastructure/persistence/typeorm/entities/template-listing-tag.orm-entity';
import { TemplateListingOrmEntity } from './infrastructure/persistence/typeorm/entities/template-listing.orm-entity';
import { TemplatePurchaseOrmEntity } from './infrastructure/persistence/typeorm/entities/template-purchase.orm-entity';
import { TemplateMarketplaceReleaseOrmEntity } from './infrastructure/persistence/typeorm/entities/template-marketplace-release.orm-entity';
import { MarketplaceWebhookEventOrmEntity } from './infrastructure/persistence/typeorm/entities/marketplace-webhook-event.orm-entity';
import { TemplateAnalyticsEventOrmEntity } from './infrastructure/persistence/typeorm/entities/template-analytics-event.orm-entity';
import { MarketplaceCommissionRateOrmEntity } from './infrastructure/persistence/typeorm/entities/marketplace-commission-rate.orm-entity';
import { TemplateReviewOrmEntity } from './infrastructure/persistence/typeorm/entities/template-review.orm-entity';
import { TemplateLikeOrmEntity } from './infrastructure/persistence/typeorm/entities/template-like.orm-entity';
import { TypeOrmTemplateReviewRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-review.repository';
import { TypeOrmTemplateLikeRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-like.repository';
import { TypeOrmTemplateFeedbackReader } from './infrastructure/persistence/typeorm/readers/typeorm-template-feedback.reader';
import { UpsertTemplateReviewHandler } from './application/commands/template-feedback/upsert-template-review/upsert-template-review.handler';
import { DeleteTemplateReviewHandler } from './application/commands/template-feedback/delete-template-review/delete-template-review.handler';
import { SetTemplateLikeHandler } from './application/commands/template-feedback/set-template-like/set-template-like.handler';
import { ListPublicTemplateReviewsHandler } from './application/queries/template-feedback/list-public-template-reviews/list-public-template-reviews.handler';
import { TemplateFeedbackController } from './presentation/http/controllers/template-feedback.controller';
import { StorageInfrastructureModule } from 'src/shared/infrastructure/storage/storage.module';
import { CreatorProfileOrmEntity } from './infrastructure/persistence/typeorm/entities/creator-profile.orm-entity';
import { TypeOrmCreatorProfileRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-creator-profile.repository';
import { TypeOrmCreatorProfileReader } from './infrastructure/persistence/typeorm/readers/typeorm-creator-profile.reader';
import { GetPublicCreatorProfileHandler } from './application/queries/creator-profile/get-public-creator-profile/get-public-creator-profile.handler';
import { GetMyCreatorProfileHandler } from './application/queries/creator-profile/get-my-creator-profile/get-my-creator-profile.handler';
import { UpsertMyCreatorProfileHandler } from './application/commands/creator-profile/upsert-my-creator-profile/upsert-my-creator-profile.handler';
import { SetCreatorImageHandler } from './application/commands/creator-profile/set-creator-image/set-creator-image.handler';
import { CreatorProfileController } from './presentation/http/controllers/creator-profile.controller';
import { PublicCreatorController } from './presentation/http/controllers/public-creator.controller';
import { TypeOrmTemplateCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-category.repository';
import { TypeOrmTemplateEntitlementRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-entitlement.repository';
import { TypeOrmTemplateListingRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-listing.repository';
import { TypeOrmTemplatePurchaseRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-purchase.repository';
import { TypeOrmTemplateMarketplaceReleaseRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-marketplace-release.repository';
import { TypeOrmMarketplaceWebhookEventRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-marketplace-webhook-event.repository';
import { TypeOrmTemplateAnalyticsEventRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-analytics-event.repository';
import { TypeOrmMarketplaceCommissionRateRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-marketplace-commission-rate.repository';
import { GetMarketplaceCommissionRateHandler } from './application/queries/marketplace-commission/get-marketplace-commission-rate/get-marketplace-commission-rate.handler';
import { UpdateMarketplaceCommissionRateHandler } from './application/commands/marketplace-commission/update-marketplace-commission-rate/update-marketplace-commission-rate.handler';
import { MyClaimedTemplatesController } from './presentation/http/controllers/my-claimed-templates.controller';
import { PublicTemplateCategoryController } from './presentation/http/controllers/public-template-category.controller';
import { PublicTemplateController } from './presentation/http/controllers/public-template.controller';
import { TemplateEntitlementController } from './presentation/http/controllers/template-entitlement.controller';
import { TemplateListingController } from './presentation/http/controllers/template-listing.controller';
import { TemplatePurchaseController } from './presentation/http/controllers/template-purchase.controller';

@Module({
  imports: [
    PaymentModule,
    TemplateContentModule,
    PermissionModule,
    StorageInfrastructureModule,
    TypeOrmModule.forFeature([
      TemplateListingOrmEntity,
      TemplateCategoryOrmEntity,
      TemplateListingCategoryOrmEntity,
      TemplateListingTagOrmEntity,
      TemplateEntitlementOrmEntity,
      TemplatePurchaseOrmEntity,
      TemplateMarketplaceReleaseOrmEntity,
      MarketplaceWebhookEventOrmEntity,
      TemplateAnalyticsEventOrmEntity,
      MarketplaceCommissionRateOrmEntity,
      TemplateReviewOrmEntity,
      TemplateLikeOrmEntity,
      CreatorProfileOrmEntity,
    ]),
  ],
  providers: [
    {
      provide: MARKETPLACE_TYPES.ports.Distribution,
      useExisting: MARKETPLACE_TYPES.repositories.TemplateListingRepository,
    },
    {
      provide: MARKETPLACE_TYPES.ports.Entitlements,
      useExisting: MARKETPLACE_TYPES.repositories.TemplateEntitlementRepository,
    },
    FreeTemplateClaimService,
    {
      provide: MARKETPLACE_TYPES.ports.FreeClaims,
      useExisting: FreeTemplateClaimService,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.UpdateTemplateListingPricingHandler,
      useClass: UpdateTemplateListingPricingHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.GetMyClaimedTemplatesHandler,
      useClass: GetMyClaimedTemplatesHandler,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.PublishTemplateToMarketplaceHandler,
      useClass: PublishTemplateToMarketplaceHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.ClaimFreeTemplateHandler,
      useClass: ClaimFreeTemplateHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.PublishTemplateListingHandler,
      useClass: PublishTemplateListingHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.CreateTemplateListingHandler,
      useClass: CreateTemplateListingHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.ListPublicTemplatesHandler,
      useClass: ListPublicTemplatesHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.GetPublicTemplatePreviewHandler,
      useClass: GetPublicTemplatePreviewHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.GetPublicTemplateDetailHandler,
      useClass: GetPublicTemplateDetailHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.GetTemplateListingHandler,
      useClass: GetTemplateListingHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.PreviewTemplateDemoHandler,
      useClass: PreviewTemplateDemoHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.UnpublishTemplateListingHandler,
      useClass: UnpublishTemplateListingHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.CreateTemplateCategoryHandler,
      useClass: CreateTemplateCategoryHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.ListTemplateCategoriesHandler,
      useClass: ListTemplateCategoriesHandler,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.ListActiveTemplateCategoriesHandler,
      useClass: ListActiveTemplateCategoriesHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.UpdateTemplateCategoryHandler,
      useClass: UpdateTemplateCategoryHandler,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.ChangeTemplateCategoryStatusHandler,
      useClass: ChangeTemplateCategoryStatusHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.CreateTemplatePurchaseHandler,
      useClass: CreateTemplatePurchaseHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.GetTemplatePurchaseHandler,
      useClass: GetTemplatePurchaseHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.GetMyTemplatePurchasesHandler,
      useClass: GetMyTemplatePurchasesHandler,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.CreateTemplatePurchaseCheckoutHandler,
      useClass: CreateTemplatePurchaseCheckoutHandler,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications
          .ResolveTemplatePurchaseReconciliationHandler,
      useClass: ResolveTemplatePurchaseReconciliationHandler,
    },
    {
      provide: MARKETPLACE_TYPES.repositories.TemplateListingRepository,
      useClass: TypeOrmTemplateListingRepository,
    },
    {
      provide: MARKETPLACE_TYPES.repositories.TemplateEntitlementRepository,
      useClass: TypeOrmTemplateEntitlementRepository,
    },
    {
      provide: MARKETPLACE_TYPES.repositories.TemplateCategoryRepository,
      useClass: TypeOrmTemplateCategoryRepository,
    },
    {
      provide: MARKETPLACE_TYPES.repositories.TemplatePurchaseRepository,
      useClass: TypeOrmTemplatePurchaseRepository,
    },
    {
      provide:
        MARKETPLACE_TYPES.repositories.TemplateMarketplaceReleaseRepository,
      useClass: TypeOrmTemplateMarketplaceReleaseRepository,
    },
    {
      provide: MARKETPLACE_TYPES.repositories.MarketplaceWebhookEventRepository,
      useClass: TypeOrmMarketplaceWebhookEventRepository,
    },
    {
      provide: MARKETPLACE_TYPES.repositories.TemplateAnalyticsEventRepository,
      useClass: TypeOrmTemplateAnalyticsEventRepository,
    },
    {
      provide:
        MARKETPLACE_TYPES.repositories.MarketplaceCommissionRateRepository,
      useClass: TypeOrmMarketplaceCommissionRateRepository,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.GetMarketplaceCommissionRateHandler,
      useClass: GetMarketplaceCommissionRateHandler,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.UpdateMarketplaceCommissionRateHandler,
      useClass: UpdateMarketplaceCommissionRateHandler,
    },
    {
      provide: MARKETPLACE_TYPES.services.TemplatePurchaseSettlementService,
      useClass: TemplatePurchaseSettlementService,
    },
    {
      provide: MARKETPLACE_TYPES.ports.CreatorReader,
      useClass: TypeOrmTemplateCreatorReader,
    },
    {
      provide: MARKETPLACE_TYPES.services.TemplatePurchaseEligibilityService,
      useClass: TemplatePurchaseEligibilityService,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.ProcessMarketplaceStripeWebhookHandler,
      useClass: ProcessMarketplaceStripeWebhookHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.RecordTemplateViewHandler,
      useClass: RecordTemplateViewHandler,
    },
    {
      provide: MARKETPLACE_TYPES.ports.AnalyticsReader,
      useClass: TypeOrmTemplateAnalyticsReader,
    },
    {
      provide: MARKETPLACE_TYPES.ports.CommissionRateReader,
      useClass: TypeOrmMarketplaceCommissionRateReader,
    },
    {
      provide: MARKETPLACE_TYPES.ports.CreatorProfileReader,
      useClass: TypeOrmCreatorProfileReader,
    },
    {
      provide: MARKETPLACE_TYPES.repositories.CreatorProfileRepository,
      useClass: TypeOrmCreatorProfileRepository,
    },
    {
      provide: MARKETPLACE_TYPES.applications.GetPublicCreatorProfileHandler,
      useClass: GetPublicCreatorProfileHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.GetMyCreatorProfileHandler,
      useClass: GetMyCreatorProfileHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.UpsertMyCreatorProfileHandler,
      useClass: UpsertMyCreatorProfileHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.SetCreatorImageHandler,
      useClass: SetCreatorImageHandler,
    },
    {
      provide: MARKETPLACE_TYPES.ports.FeedbackReader,
      useClass: TypeOrmTemplateFeedbackReader,
    },
    {
      provide: MARKETPLACE_TYPES.repositories.TemplateReviewRepository,
      useClass: TypeOrmTemplateReviewRepository,
    },
    {
      provide: MARKETPLACE_TYPES.repositories.TemplateLikeRepository,
      useClass: TypeOrmTemplateLikeRepository,
    },
    {
      provide: MARKETPLACE_TYPES.applications.UpsertTemplateReviewHandler,
      useClass: UpsertTemplateReviewHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.DeleteTemplateReviewHandler,
      useClass: DeleteTemplateReviewHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.SetTemplateLikeHandler,
      useClass: SetTemplateLikeHandler,
    },
    {
      provide: MARKETPLACE_TYPES.applications.ListPublicTemplateReviewsHandler,
      useClass: ListPublicTemplateReviewsHandler,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.ListCreatorTemplateAnalyticsHandler,
      useClass: ListCreatorTemplateAnalyticsHandler,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.GetCreatorTemplateAnalyticsHandler,
      useClass: GetCreatorTemplateAnalyticsHandler,
    },
  ],
  controllers: [
    MyClaimedTemplatesController,
    TemplateListingController,
    PublicTemplateController,
    TemplateEntitlementController,
    PublicTemplateCategoryController,
    TemplatePurchaseController,
    CreatorTemplateAnalyticsController,
    TemplateFeedbackController,
    CreatorProfileController,
    PublicCreatorController,
  ],
  exports: [
    MARKETPLACE_TYPES.ports.Distribution,
    MARKETPLACE_TYPES.ports.Entitlements,
    MARKETPLACE_TYPES.ports.FreeClaims,
    MARKETPLACE_TYPES.repositories.TemplateMarketplaceReleaseRepository,
    MARKETPLACE_TYPES.repositories.TemplateAnalyticsEventRepository,
    MARKETPLACE_TYPES.applications.CreateTemplateCategoryHandler,
    MARKETPLACE_TYPES.applications.ListTemplateCategoriesHandler,
    MARKETPLACE_TYPES.applications.UpdateTemplateCategoryHandler,
    MARKETPLACE_TYPES.applications.ChangeTemplateCategoryStatusHandler,

    MARKETPLACE_TYPES.applications.ProcessMarketplaceStripeWebhookHandler,
    MARKETPLACE_TYPES.applications.ResolveTemplatePurchaseReconciliationHandler,
    MARKETPLACE_TYPES.applications.GetMarketplaceCommissionRateHandler,
    MARKETPLACE_TYPES.applications.UpdateMarketplaceCommissionRateHandler,
  ],
})
export class MarketplaceModule {}
