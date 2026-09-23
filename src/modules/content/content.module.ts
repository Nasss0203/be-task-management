import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from 'src/database/database.module';
import { PermissionModule } from 'src/modules/permission/permission.module';
import { WorkspaceModule } from 'src/modules/workspace/workspace.module';

import { AddDatabaseViewToBlockHandler } from './application/commands/page-block/add-database-view-to-block/add-database-view-to-block.handler';
import { CreatePageBlockHandler } from './application/commands/page-block/create-page-block/create-page-block.handler';
import { DeletePageBlockHandler } from './application/commands/page-block/delete-page-block/delete-page-block.handler';
import { MovePageBlockHandler } from './application/commands/page-block/move-page-block/move-page-block.handler';
import { ReorderPageBlockHandler } from './application/commands/page-block/reorder-page-block/reorder-page-block.handler';
import { RestorePageBlockHandler } from './application/commands/page-block/restore-page-block/restore-page-block.handler';
import { UpdatePageBlockHandler } from './application/commands/page-block/update-page-block/update-page-block.handler';
import { CreatePageHandler } from './application/commands/page/create-page/create-page.handler';
import { DeletePageHandler } from './application/commands/page/delete-page/delete-page.handler';
import { PermanentlyDeletePageHandler } from './application/commands/page/permanently-delete-page/permanently-delete-page.handler';
import { RestorePageHandler } from './application/commands/page/restore-page/restore-page.handler';
import { UpdatePageHandler } from './application/commands/page/update-page/update-page.handler';

import { FindDeletedPageBlocksHandler } from './application/queries/page-block/find-deleted-page-blocks/find-deleted-page-blocks.handler';
import { FindPageBlockByIdHandler } from './application/queries/page-block/find-page-block-by-id/find-page-block-by-id.handler';
import { FindPageBlockByPageHandler } from './application/queries/page-block/find-page-block-by-page/find-page-block-by-page.handler';
import { FindPageTemplateBlockByTemplateHandler } from './application/queries/page-template/find-page-template-block-by-template/find-page-template-block-by-template.handler';
import { FindPageTemplateHandler } from './application/queries/page-template/find-page-template/find-page-template.handler';
import { FindDeletedPagesHandler } from './application/queries/page/find-deleted-pages/find-deleted-pages.handler';
import { FindPageByIdHandler } from './application/queries/page/find-page-by-id/find-page-by-id.handler';
import { FindPageByWorkspaceHandler } from './application/queries/page/find-page-by-workspace/find-page-by-workspace.handler';
import { ResolveBookmarkMetadataHandler } from './application/queries/resolve-bookmark-metadata/resolve-bookmark-metadata.handler';

import { ContentPageProvisioningService } from './application/services/content-page-provisioning.service';
import { PageBlockOrderingService } from './application/services/page-block-ordering.service';

import { CONTENT_TYPES } from './content.types';

import { HtmlBookmarkMetadataFetcherAdapter } from './infrastructure/metadata/html-bookmark-metadata-fetcher.adapter';

import { PageBlockOrmEntity } from './infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageTemplateBlockOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-block.orm-entity';
import { PageTemplateOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { PageOrmEntity } from './infrastructure/persistence/typeorm/entities/page.orm-entity';

import { TypeOrmPageBlockRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-block.repository';
import { TypeOrmPageTemplateBlockRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template-block.repository';
import { TypeOrmPageTemplateRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template.repository';
import { TypeOrmPageRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page.repository';

import { CreatePageEditRequestHandler } from './application/commands/page-edit-request/create-page-edit-request/create-page-edit-request.handler';

import { PageShareLinkTokenService } from '../../shared/security/page-share-link-token.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApprovePageAccessRequestHandler } from './application/commands/page-access-request/approve-page-access-request/approve-page-access-request.handler';
import { CreatePageAccessRequestHandler } from './application/commands/page-access-request/create-page-access-request/create-page-access-request.handler';
import { RejectPageAccessRequestHandler } from './application/commands/page-access-request/reject-page-access-request/reject-page-access-request.handler';
import { ApprovePageEditRequestHandler } from './application/commands/page-edit-request/approve-page-edit-request/approve-page-edit-request.handler';
import { RejectPageEditRequestHandler } from './application/commands/page-edit-request/reject-page-edit-request/reject-page-edit-request.handler';
import { AddPageFavoriteHandler } from './application/commands/page-favorite/add-page-favorite/add-page-favorite.handler';
import { RemovePageFavoriteHandler } from './application/commands/page-favorite/remove-page-favorite/remove-page-favorite.handler';
import { UpdatePageShareSettingHandler } from './application/commands/page-share-setting/update-page-share-setting/update-page-share-setting.handler';
import { AcceptPageShareLinkHandler } from './application/commands/page-share/accept-page-share-link/accept-page-share-link.handler';
import { CreatePageShareLinkHandler } from './application/commands/page-share/create-page-share-link/create-page-share-link.handler';
import { RejectPageShareLinkHandler } from './application/commands/page-share/reject-page-share-link/reject-page-share-link.handler';
import { RemovePageShareHandler } from './application/commands/page-share/remove-page-share/remove-page-share.handler';
import { SharePageHandler } from './application/commands/page-share/share-page/share-page.handler';
import { UpdatePageShareHandler } from './application/commands/page-share/update-page-share/update-page-share.handler';
import { DuplicatePageHandler } from './application/commands/page/duplicate-page/duplicate-page.handler';
import { MovePageHandler } from './application/commands/page/move-page/move-page.handler';
import { GetMyPageAccessRequestHandler } from './application/queries/page-access-request/get-my-page-access-request/get-my-page-access-request.handler';
import { GetPageAccessRequestsHandler } from './application/queries/page-access-request/get-page-access-requests/get-page-access-requests.handler';
import { GetPageAccessHandler } from './application/queries/page-access/get-page-access/get-page-access.handler';
import { GetMyPageEditRequestsHandler } from './application/queries/page-edit-request/get-my-page-edit-requests/get-my-page-edit-requests.handler';
import { GetPageEditRequestsHandler } from './application/queries/page-edit-request/get-page-edit-requests/get-page-edit-requests.handler';
import { ListPageFavoritesHandler } from './application/queries/page-favorite/list-page-favorites/list-page-favorites.handler';
import { GetPageShareSettingHandler } from './application/queries/page-share-setting/get-page-share-setting/get-page-share-setting.handler';
import { GetPageSharesHandler } from './application/queries/page-share/get-page-shares/get-page-shares.handler';
import { GetPagesSharedWithMeHandler } from './application/queries/page-share/get-pages-shared-with-me/get-pages-shared-with-me.handler';
import { ResolvePageShareLinkHandler } from './application/queries/page-share/resolve-page-share-link/resolve-page-share-link.handler';
import { SearchPageShareCandidatesHandler } from './application/queries/page-share/search-page-share-candidates/search-page-share-candidates.handler';
import { PageAccessRequestOrmEntity } from './infrastructure/persistence/typeorm/entities/page-access-request.orm-entity';
import { PageEditRequestOrmEntity } from './infrastructure/persistence/typeorm/entities/page-edit-request.orm-entity';
import { PageFavoriteOrmEntity } from './infrastructure/persistence/typeorm/entities/page-favorite.orm-entity';
import { PageShareLinkOrmEntity } from './infrastructure/persistence/typeorm/entities/page-share-link.orm-entity';
import { PageShareSettingOrmEntity } from './infrastructure/persistence/typeorm/entities/page-share-setting.orm-entity';
import { PageShareOrmEntity } from './infrastructure/persistence/typeorm/entities/page-share.orm-entity';
import { TypeOrmPageAccessRequestRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-access-request.repository';
import { TypeOrmPageEditRequestRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-edit-request.repository';
import { TypeOrmPageFavoriteRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-favorite.repository';
import { TypeOrmPageShareLinkRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-share-link.repository';
import { TypeOrmPageShareSettingRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-share-setting.repository';
import { TypeOrmPageShareRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-share.repository';
import { PageAccessRequestController } from './presentation/http/controllers/page-access-request.controller';
import { PageBlockController } from './presentation/http/controllers/page-block.controller';
import { PageEditRequestController } from './presentation/http/controllers/page-edit-request.controller';
import { PageFavoriteController } from './presentation/http/controllers/page-favorite.controller';
import { PageShareSettingsController } from './presentation/http/controllers/page-share-settings.controller';
import { PageShareController } from './presentation/http/controllers/page-share.controller';
import { PageTemplateBlocksController } from './presentation/http/controllers/page-template-blocks.controller';
import { PageTemplatesController } from './presentation/http/controllers/page-templates.controller';
import { PageController } from './presentation/http/controllers/page.controller';

const repositories = [
  {
    provide: CONTENT_TYPES.repositories.PageRepository,
    useClass: TypeOrmPageRepository,
  },
  {
    provide: CONTENT_TYPES.repositories.PageBlockRepository,
    useClass: TypeOrmPageBlockRepository,
  },
  {
    provide: CONTENT_TYPES.repositories.PageTemplateRepository,
    useClass: TypeOrmPageTemplateRepository,
  },
  {
    provide: CONTENT_TYPES.repositories.PageTemplateBlockRepository,
    useClass: TypeOrmPageTemplateBlockRepository,
  },
  {
    provide: CONTENT_TYPES.repositories.PageFavoriteRepository,
    useClass: TypeOrmPageFavoriteRepository,
  },
  {
    provide: CONTENT_TYPES.repositories.PageShareRepository,
    useClass: TypeOrmPageShareRepository,
  },
  {
    provide: CONTENT_TYPES.repositories.PageShareLinkRepository,
    useClass: TypeOrmPageShareLinkRepository,
  },
  {
    provide: CONTENT_TYPES.repositories.PageEditRequestRepository,
    useClass: TypeOrmPageEditRequestRepository,
  },
  {
    provide: CONTENT_TYPES.repositories.PageShareSettingRepository,

    useClass: TypeOrmPageShareSettingRepository,
  },
  {
    provide: CONTENT_TYPES.repositories.PageAccessRequestRepository,

    useClass: TypeOrmPageAccessRequestRepository,
  },
];

const pageHandlers = [
  {
    provide: CONTENT_TYPES.applications.CreatePageHandler,
    useClass: CreatePageHandler,
  },
  {
    provide: CONTENT_TYPES.applications.UpdatePageHandler,
    useClass: UpdatePageHandler,
  },
  {
    provide: CONTENT_TYPES.applications.DeletePageHandler,
    useClass: DeletePageHandler,
  },
  {
    provide: CONTENT_TYPES.applications.RestorePageHandler,
    useClass: RestorePageHandler,
  },
  {
    provide: CONTENT_TYPES.applications.PermanentlyDeletePageHandler,
    useClass: PermanentlyDeletePageHandler,
  },
  {
    provide: CONTENT_TYPES.applications.FindPageByWorkspaceHandler,
    useClass: FindPageByWorkspaceHandler,
  },
  {
    provide: CONTENT_TYPES.applications.FindDeletedPagesHandler,
    useClass: FindDeletedPagesHandler,
  },
  {
    provide: CONTENT_TYPES.applications.FindPageByIdHandler,
    useClass: FindPageByIdHandler,
  },
  {
    provide: CONTENT_TYPES.applications.MovePageHandler,
    useClass: MovePageHandler,
  },
  {
    provide: CONTENT_TYPES.applications.DuplicatePageHandler,
    useClass: DuplicatePageHandler,
  },

  {
    provide: CONTENT_TYPES.applications.GetPageAccessHandler,
    useClass: GetPageAccessHandler,
  },
];

const pageBlockHandlers = [
  {
    provide: CONTENT_TYPES.applications.CreatePageBlockHandler,
    useClass: CreatePageBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.AddDatabaseViewToBlockHandler,
    useClass: AddDatabaseViewToBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.UpdatePageBlockHandler,
    useClass: UpdatePageBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.ReorderPageBlockHandler,
    useClass: ReorderPageBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.MovePageBlockHandler,
    useClass: MovePageBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.DeletePageBlockHandler,
    useClass: DeletePageBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.RestorePageBlockHandler,
    useClass: RestorePageBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.FindPageBlockByPageHandler,
    useClass: FindPageBlockByPageHandler,
  },
  {
    provide: CONTENT_TYPES.applications.FindPageBlockByIdHandler,
    useClass: FindPageBlockByIdHandler,
  },
  {
    provide: CONTENT_TYPES.applications.FindDeletedPageBlocksHandler,
    useClass: FindDeletedPageBlocksHandler,
  },
];

const pageTemplateHandlers = [
  {
    provide: CONTENT_TYPES.applications.FindPageTemplateHandler,
    useClass: FindPageTemplateHandler,
  },
  {
    provide: CONTENT_TYPES.applications.FindPageTemplateBlockByTemplateHandler,
    useClass: FindPageTemplateBlockByTemplateHandler,
  },
  {
    provide: CONTENT_TYPES.applications.AddPageFavoriteHandler,
    useClass: AddPageFavoriteHandler,
  },
  {
    provide: CONTENT_TYPES.applications.RemovePageFavoriteHandler,
    useClass: RemovePageFavoriteHandler,
  },
  {
    provide: CONTENT_TYPES.applications.ListPageFavoritesHandler,
    useClass: ListPageFavoritesHandler,
  },
];

const pageShareHandlers = [
  {
    provide: CONTENT_TYPES.applications.CreatePageShareLinkHandler,
    useClass: CreatePageShareLinkHandler,
  },
  {
    provide: CONTENT_TYPES.applications.AcceptPageShareLinkHandler,
    useClass: AcceptPageShareLinkHandler,
  },
  {
    provide: CONTENT_TYPES.applications.GetPagesSharedWithMeHandler,
    useClass: GetPagesSharedWithMeHandler,
  },
  {
    provide: CONTENT_TYPES.applications.GetPageSharesHandler,
    useClass: GetPageSharesHandler,
  },
  {
    provide: CONTENT_TYPES.applications.UpdatePageShareHandler,
    useClass: UpdatePageShareHandler,
  },
  {
    provide: CONTENT_TYPES.applications.RemovePageShareHandler,
    useClass: RemovePageShareHandler,
  },
  {
    provide: CONTENT_TYPES.applications.SharePageHandler,
    useClass: SharePageHandler,
  },
  {
    provide: CONTENT_TYPES.applications.SearchPageShareCandidatesHandler,
    useClass: SearchPageShareCandidatesHandler,
  },
  {
    provide: CONTENT_TYPES.applications.ResolvePageShareLinkHandler,
    useClass: ResolvePageShareLinkHandler,
  },
  {
    provide: CONTENT_TYPES.applications.RejectPageShareLinkHandler,
    useClass: RejectPageShareLinkHandler,
  },
];

const pageEditRequestHandlers = [
  {
    provide: CONTENT_TYPES.applications.CreatePageEditRequestHandler,
    useClass: CreatePageEditRequestHandler,
  },
  {
    provide: CONTENT_TYPES.applications.GetPageEditRequestsHandler,
    useClass: GetPageEditRequestsHandler,
  },
  {
    provide: CONTENT_TYPES.applications.ApprovePageEditRequestHandler,
    useClass: ApprovePageEditRequestHandler,
  },
  {
    provide: CONTENT_TYPES.applications.RejectPageEditRequestHandler,
    useClass: RejectPageEditRequestHandler,
  },
  {
    provide: CONTENT_TYPES.applications.GetMyPageEditRequestsHandler,
    useClass: GetMyPageEditRequestsHandler,
  },
];

const pageShareSettingsHandlers = [
  {
    provide: CONTENT_TYPES.applications.GetPageShareSettingHandler,
    useClass: GetPageShareSettingHandler,
  },
  {
    provide: CONTENT_TYPES.applications.UpdatePageShareSettingHandler,

    useClass: UpdatePageShareSettingHandler,
  },
];

const pageAccessRequestHandler = [
  {
    provide: CONTENT_TYPES.applications.CreatePageAccessRequestHandler,
    useClass: CreatePageAccessRequestHandler,
  },
  {
    provide: CONTENT_TYPES.applications.ApprovePageAccessRequestHandler,
    useClass: ApprovePageAccessRequestHandler,
  },
  {
    provide: CONTENT_TYPES.applications.RejectPageAccessRequestHandler,
    useClass: RejectPageAccessRequestHandler,
  },
  {
    provide: CONTENT_TYPES.applications.GetPageAccessRequestsHandler,
    useClass: GetPageAccessRequestsHandler,
  },
  {
    provide: CONTENT_TYPES.applications.GetMyPageAccessRequestHandler,
    useClass: GetMyPageAccessRequestHandler,
  },
];
const bookmarkHandlers = [ResolveBookmarkMetadataHandler];

const applicationServices = [
  PageBlockOrderingService,
  PageShareLinkTokenService,
];

const ports = [
  {
    provide: CONTENT_TYPES.ports.PageProvisioning,
    useClass: ContentPageProvisioningService,
  },
  {
    provide: CONTENT_TYPES.bookmarkMetadataFetcher,
    useClass: HtmlBookmarkMetadataFetcherAdapter,
  },
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PageOrmEntity,
      PageBlockOrmEntity,
      PageTemplateOrmEntity,
      PageTemplateBlockOrmEntity,
      PageFavoriteOrmEntity,
      PageShareOrmEntity,
      PageShareLinkOrmEntity,
      PageEditRequestOrmEntity,
      PageShareSettingOrmEntity,
      PageAccessRequestOrmEntity,
    ]),
    DatabaseModule,
    PermissionModule,
    NotificationsModule,
    forwardRef(() => WorkspaceModule),
  ],

  controllers: [
    PageFavoriteController,
    PageController,
    PageBlockController,
    PageTemplatesController,
    PageTemplateBlocksController,
    PageShareController,
    PageEditRequestController,
    PageShareSettingsController,
    PageAccessRequestController,
  ],

  providers: [
    ...repositories,
    ...pageHandlers,
    ...pageBlockHandlers,
    ...pageTemplateHandlers,
    ...pageEditRequestHandlers,
    ...pageShareHandlers,
    ...pageShareSettingsHandlers,
    ...pageAccessRequestHandler,
    ...bookmarkHandlers,
    ...applicationServices,
    ...ports,
  ],

  exports: [
    CONTENT_TYPES.ports.PageProvisioning,
    CONTENT_TYPES.repositories.PageRepository,
    CONTENT_TYPES.repositories.PageBlockRepository,
  ],
})
export class ContentModule {}
