import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { PaymentModule } from '../payment/payment.module';
import { PermissionModule } from '../permission/permission.module';
import { TemplateContentModule } from '../template/template-content.module';
import { PublishTemplateToMarketplaceHandler } from './application/commands/publish-template-to-marketplace/publish-template-to-marketplace.handler';
import { CreateTemplateCategoryHandler } from './application/commands/template-category/create-template-category/create-template-category.handler';
import { UpdateTemplateCategoryHandler } from './application/commands/template-category/update-template-category/update-template-category.handler';
import { ClaimFreeTemplateHandler } from './application/commands/template-entitlement/claim-free-template/claim-free-template.handler';
import { FreeTemplateClaimService } from './application/services/free-template-claim.service';
import { CreateTemplateListingHandler } from './application/commands/template-listing/create-template-listing/create-template-listing.handler';
import { PublishTemplateListingHandler } from './application/commands/template-listing/publish-template-listing/publish-template-listing.handler';
import { UnpublishTemplateListingHandler } from './application/commands/template-listing/unpublish-template-listing/unpublish-template-listing.handler';
import { UpdateTemplateListingPricingHandler } from './application/commands/template-listing/update-template-listing-pricing/update-template-listing-pricing.handler';
import { CreateTemplatePurchaseCheckoutHandler } from './application/commands/template-purchase/create-template-purchase-checkout/create-template-purchase-checkout.handler';
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
import { TemplateCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/template-category.orm-entity';
import { TemplateEntitlementOrmEntity } from './infrastructure/persistence/typeorm/entities/template-entitlement.orm-entity';
import { TemplateListingCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/template-listing-category.orm-entity';
import { TemplateListingOrmEntity } from './infrastructure/persistence/typeorm/entities/template-listing.orm-entity';
import { TemplatePurchaseOrmEntity } from './infrastructure/persistence/typeorm/entities/template-purchase.orm-entity';
import { TemplateMarketplaceReleaseOrmEntity } from './infrastructure/persistence/typeorm/entities/template-marketplace-release.orm-entity';
import { MarketplaceWebhookEventOrmEntity } from './infrastructure/persistence/typeorm/entities/marketplace-webhook-event.orm-entity';
import { TypeOrmTemplateCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-category.repository';
import { TypeOrmTemplateEntitlementRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-entitlement.repository';
import { TypeOrmTemplateListingRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-listing.repository';
import { TypeOrmTemplatePurchaseRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-purchase.repository';
import { TypeOrmTemplateMarketplaceReleaseRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-marketplace-release.repository';
import { TypeOrmMarketplaceWebhookEventRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-marketplace-webhook-event.repository';
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
    TypeOrmModule.forFeature([
      TemplateListingOrmEntity,
      TemplateCategoryOrmEntity,
      TemplateListingCategoryOrmEntity,
      TemplateEntitlementOrmEntity,
      TemplatePurchaseOrmEntity,
      TemplateMarketplaceReleaseOrmEntity,
      MarketplaceWebhookEventOrmEntity,
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
      provide:
        MARKETPLACE_TYPES.applications.CreateTemplatePurchaseCheckoutHandler,
      useClass: CreateTemplatePurchaseCheckoutHandler,
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
      provide: MARKETPLACE_TYPES.services.TemplatePurchaseSettlementService,
      useClass: TemplatePurchaseSettlementService,
    },
    {
      provide:
        MARKETPLACE_TYPES.applications.ProcessMarketplaceStripeWebhookHandler,
      useClass: ProcessMarketplaceStripeWebhookHandler,
    },
  ],
  controllers: [
    MyClaimedTemplatesController,
    TemplateListingController,
    PublicTemplateController,
    TemplateEntitlementController,
    PublicTemplateCategoryController,
    TemplatePurchaseController,
  ],
  exports: [
    MARKETPLACE_TYPES.ports.Distribution,
    MARKETPLACE_TYPES.ports.Entitlements,
    MARKETPLACE_TYPES.ports.FreeClaims,
    MARKETPLACE_TYPES.repositories.TemplateMarketplaceReleaseRepository,
    MARKETPLACE_TYPES.applications.CreateTemplateCategoryHandler,
    MARKETPLACE_TYPES.applications.ListTemplateCategoriesHandler,
    MARKETPLACE_TYPES.applications.UpdateTemplateCategoryHandler,
    MARKETPLACE_TYPES.applications.ChangeTemplateCategoryStatusHandler,

    MARKETPLACE_TYPES.applications.ProcessMarketplaceStripeWebhookHandler,
  ],
})
export class MarketplaceModule {}
