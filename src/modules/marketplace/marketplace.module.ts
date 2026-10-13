import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { TemplateContentModule } from '../template/template-content.module';
import { PermissionModule } from '../permission/permission.module';
import { UpdateTemplateListingPricingHandler } from './application/commands/template-listing/update-template-listing-pricing/update-template-listing-pricing.handler';
import { GetMyClaimedTemplatesHandler } from './application/queries/template-entitlement/get-my-claimed-templates/get-my-claimed-templates.handler';
import { PublishTemplateToMarketplaceHandler } from './application/commands/publish-template-to-marketplace/publish-template-to-marketplace.handler';
import { ClaimFreeTemplateHandler } from './application/commands/template-entitlement/claim-free-template/claim-free-template.handler';
import { PublishTemplateListingHandler } from './application/commands/template-listing/publish-template-listing/publish-template-listing.handler';
import { CreateTemplateListingHandler } from './application/commands/template-listing/create-template-listing/create-template-listing.handler';
import { ListPublicTemplatesHandler } from './application/queries/page-template/list-public-templates/list-public-templates.handler';
import { GetPublicTemplatePreviewHandler } from './application/queries/template-preview/get-public-template-preview/get-public-template-preview.handler';
import { GetPublicTemplateDetailHandler } from './application/queries/template-preview/get-public-template-detail/get-public-template-detail.handler';
import { GetTemplateListingHandler } from './application/queries/template-listing/get-template-listing/get-template-listing.handler';
import { UnpublishTemplateListingHandler } from './application/commands/template-listing/unpublish-template-listing/unpublish-template-listing.handler';
import { CreateTemplateCategoryHandler } from './application/commands/template-category/create-template-category/create-template-category.handler';
import { ListTemplateCategoriesHandler } from './application/queries/template-category/list-template-categories/list-template-categories.handler';
import { ListActiveTemplateCategoriesHandler } from './application/queries/template-category/list-active-template-categories/list-active-template-categories.handler';
import { UpdateTemplateCategoryHandler } from './application/commands/template-category/update-template-category/update-template-category.handler';
import { ChangeTemplateCategoryStatusHandler } from './application/queries/template-category/change-template-category-status/change-template-category-status.handler';
import { TypeOrmTemplateListingRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-listing.repository';
import { TypeOrmTemplateEntitlementRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-entitlement.repository';
import { TypeOrmTemplateCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-category.repository';
import { TemplateListingOrmEntity } from './infrastructure/persistence/typeorm/entities/template-listing.orm-entity';
import { TemplateCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/template-category.orm-entity';
import { TemplateListingCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/template-listing-category.orm-entity';
import { TemplateEntitlementOrmEntity } from './infrastructure/persistence/typeorm/entities/template-entitlement.orm-entity';
import { MyClaimedTemplatesController } from './presentation/http/controllers/my-claimed-templates.controller';
import { TemplateListingController } from './presentation/http/controllers/template-listing.controller';
import { PublicTemplateController } from './presentation/http/controllers/public-template.controller';
import { TemplateEntitlementController } from './presentation/http/controllers/template-entitlement.controller';
import { PublicTemplateCategoryController } from './presentation/http/controllers/public-template-category.controller';
@Module({
  imports: [
    TemplateContentModule,
    PermissionModule,
    TypeOrmModule.forFeature([
      TemplateListingOrmEntity,
      TemplateCategoryOrmEntity,
      TemplateListingCategoryOrmEntity,
      TemplateEntitlementOrmEntity,
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
  ],
  controllers: [
    MyClaimedTemplatesController,
    TemplateListingController,
    PublicTemplateController,
    TemplateEntitlementController,
    PublicTemplateCategoryController,
  ],
  exports: [
    MARKETPLACE_TYPES.ports.Distribution,
    MARKETPLACE_TYPES.ports.Entitlements,
    MARKETPLACE_TYPES.applications.CreateTemplateCategoryHandler,
    MARKETPLACE_TYPES.applications.ListTemplateCategoriesHandler,
    MARKETPLACE_TYPES.applications.UpdateTemplateCategoryHandler,
    MARKETPLACE_TYPES.applications.ChangeTemplateCategoryStatusHandler,
  ],
})
export class MarketplaceModule {}
