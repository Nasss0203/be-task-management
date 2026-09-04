import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from 'src/database/database.module';
import { PermissionModule } from 'src/modules/permission/permission.module';

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

import { AddPageFavoriteHandler } from './application/commands/page-favorite/add-page-favorite/add-page-favorite.handler';
import { RemovePageFavoriteHandler } from './application/commands/page-favorite/remove-page-favorite/remove-page-favorite.handler';
import { DuplicatePageHandler } from './application/commands/page/duplicate-page/duplicate-page.handler';
import { MovePageHandler } from './application/commands/page/move-page/move-page.handler';
import { ListPageFavoritesHandler } from './application/queries/page-favorite/list-page-favorites/list-page-favorites.handler';
import { PageFavoriteOrmEntity } from './infrastructure/persistence/typeorm/entities/page-favorite.orm-entity';
import { TypeOrmPageFavoriteRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-favorite.repository';
import { PageBlockController } from './presentation/http/controllers/page-block.controller';
import { PageFavoriteController } from './presentation/http/controllers/page-favorite.controller';
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

const bookmarkHandlers = [ResolveBookmarkMetadataHandler];

const applicationServices = [PageBlockOrderingService];

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
    ]),
    DatabaseModule,
    PermissionModule,
  ],

  controllers: [
    PageFavoriteController,
    PageController,
    PageBlockController,
    PageTemplatesController,
    PageTemplateBlocksController,
  ],

  providers: [
    ...repositories,
    ...pageHandlers,
    ...pageBlockHandlers,
    ...pageTemplateHandlers,
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
