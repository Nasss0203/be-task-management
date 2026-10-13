import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { BullModule } from '@nestjs/bullmq';
import { TEMPLATE_THUMBNAIL_QUEUE } from './infrastructure/queue/template-thumbnail-queue.constants';
import { ContentModule } from '../content/content.module';
import { DatabaseModule } from 'src/modules/database/database.module';
import { PermissionModule } from '../permission/permission.module';
import { StorageInfrastructureModule } from 'src/shared/infrastructure/storage/storage.module';
import { CreatePageTemplateHandler } from './application/commands/page-template/create-page-template/create-page-template.handler';
import { UpdatePageTemplateHandler } from './application/commands/page-template/update-page-template/update-page-template.handler';
import { ArchivePageTemplateHandler } from './application/commands/page-template/archive-page-template/archive-page-template.handler';
import { RestorePageTemplateHandler } from './application/commands/page-template/restore-page-template/restore-page-template.handler';
import { CreateTemplateVersionHandler } from './application/commands/template-version/create-template-version/create-template-version.handler';
import { ReplaceTemplateBlocksHandler } from './application/commands/template-block/replace-template-blocks/replace-template-blocks.handler';
import { PublishTemplateVersionHandler } from './application/commands/template-version/publish-template-version/publish-template-version.handler';
import { GetPageTemplateHandler } from './application/queries/page-template/get-page-template/get-page-template.handler';
import { GetTemplateVersionHandler } from './application/queries/template-version/get-template-version/get-template-version.handler';
import { ListTemplateVersionsHandler } from './application/queries/template-version/list-template-versions/list-template-versions.handler';
import { GetTemplateVersionBlocksHandler } from './application/queries/template-block/get-template-version-blocks/get-template-version-blocks.handler';
import { GetTemplatePreviewHandler } from './application/queries/template-preview/get-template-preview/get-template-preview.handler';
import { GetInternalTemplateRenderHandler } from './application/queries/internal-template-render/get-internal-template-render/get-internal-template-render.handler';
import { ListPageTemplatesHandler } from './application/queries/page-template/list-page-templates/list-page-templates.handler';
import { GenerateTemplateVersionThumbnailHandler } from './application/commands/generate-template-version-thumbnail/generate-template-version-thumbnail.handler';
import { GetTemplateVersionThumbnailHandler } from './application/queries/template-version/get-template-version-thumbnail/get-template-version-thumbnail.handler';
import { PlaywrightTemplateThumbnailRendererService } from './infrastructure/rendering/playwright-template-thumbnail-renderer.service';
import { BullMqTemplateThumbnailJobQueue } from './infrastructure/queue/bullmq-template-thumbnail-job-queue.service';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { TypeOrmPageTemplateRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template.repository';
import { TypeOrmTemplateVersionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-version.repository';
import { TypeOrmPageTemplateBlockRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template-block.repository';
import { TypeOrmPageTemplateDatabaseSnapshotRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template-database-snapshot.repository';
import { TypeOrmTemplateVersionAssetRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-version-asset.repository';
import { PageTemplateOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { PageTemplateVersionOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-version.orm-entity';
import { PageTemplateBlockOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-block.orm-entity';
import { PageTemplateDatabaseOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database.orm-entity';
import { TemplateVersionAssetOrmEntity } from './infrastructure/persistence/typeorm/entities/template-version-asset.orm-entity';
import { PageTemplateDatabasePropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-property.orm-entity';
import { PageTemplateDatabasePropertyOptionOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-property-option.orm-entity';
import { PageTemplateDatabaseRowOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-row.orm-entity';
import { PageTemplateDatabaseRowValueOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-row-value.orm-entity';
import { PageTemplateDatabaseViewOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-view.orm-entity';
import { PageTemplateDatabaseViewPropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-view-property.orm-entity';
import { TemplateVersionContentSnapshotService } from './application/services/template-version-content-snapshot.service';
import { TemplateSnapshotFingerprintService } from './application/services/template-snapshot-fingerprint.service';
import { TemplatePreviewLoader } from './application/services/template-preview-loader.service';
import { TemplateThumbnailProcessor } from './infrastructure/queue/template-thumbnail.processor';
import { InternalTemplateRenderGuard } from 'src/common/guard/internal-template-render.guard';
@Module({
  imports: [
    BullModule.registerQueue({ name: TEMPLATE_THUMBNAIL_QUEUE }),
    ContentModule,
    DatabaseModule,
    PermissionModule,
    StorageInfrastructureModule,
    TypeOrmModule.forFeature([
      PageTemplateOrmEntity,
      PageTemplateVersionOrmEntity,
      PageTemplateBlockOrmEntity,
      PageTemplateDatabaseOrmEntity,
      TemplateVersionAssetOrmEntity,
      PageTemplateDatabasePropertyOrmEntity,
      PageTemplateDatabasePropertyOptionOrmEntity,
      PageTemplateDatabaseRowOrmEntity,
      PageTemplateDatabaseRowValueOrmEntity,
      PageTemplateDatabaseViewOrmEntity,
      PageTemplateDatabaseViewPropertyOrmEntity,
    ]),
  ],
  providers: [
    {
      provide: TEMPLATE_TYPES.ports.Content,
      useExisting: TEMPLATE_TYPES.repositories.PageTemplateRepository,
    },
    {
      provide: TEMPLATE_TYPES.ports.Versions,
      useExisting: TEMPLATE_TYPES.repositories.TemplateVersionRepository,
    },
    {
      provide: TEMPLATE_TYPES.applications.CreatePageTemplateHandler,
      useClass: CreatePageTemplateHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.UpdatePageTemplateHandler,
      useClass: UpdatePageTemplateHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.ArchivePageTemplateHandler,
      useClass: ArchivePageTemplateHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.RestorePageTemplateHandler,
      useClass: RestorePageTemplateHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.CreateTemplateVersionHandler,
      useClass: CreateTemplateVersionHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.ReplaceTemplateBlocksHandler,
      useClass: ReplaceTemplateBlocksHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.PublishTemplateVersionHandler,
      useClass: PublishTemplateVersionHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.GetPageTemplateHandler,
      useClass: GetPageTemplateHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.GetTemplateVersionHandler,
      useClass: GetTemplateVersionHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.ListTemplateVersionsHandler,
      useClass: ListTemplateVersionsHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.GetTemplateVersionBlocksHandler,
      useClass: GetTemplateVersionBlocksHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.GetTemplatePreviewHandler,
      useClass: GetTemplatePreviewHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.GetInternalTemplateRenderHandler,
      useClass: GetInternalTemplateRenderHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.ListPageTemplatesHandler,
      useClass: ListPageTemplatesHandler,
    },
    {
      provide:
        TEMPLATE_TYPES.applications.GenerateTemplateVersionThumbnailHandler,
      useClass: GenerateTemplateVersionThumbnailHandler,
    },
    {
      provide: TEMPLATE_TYPES.applications.GetTemplateVersionThumbnailHandler,
      useClass: GetTemplateVersionThumbnailHandler,
    },
    {
      provide: TEMPLATE_TYPES.services.TemplateThumbnailRenderer,
      useClass: PlaywrightTemplateThumbnailRendererService,
    },
    {
      provide: TEMPLATE_TYPES.services.TemplateThumbnailJobQueue,
      useClass: BullMqTemplateThumbnailJobQueue,
    },
    {
      provide: PERSISTENCE_TYPES.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
    {
      provide: TEMPLATE_TYPES.repositories.PageTemplateRepository,
      useClass: TypeOrmPageTemplateRepository,
    },
    {
      provide: TEMPLATE_TYPES.repositories.TemplateVersionRepository,
      useClass: TypeOrmTemplateVersionRepository,
    },
    {
      provide: TEMPLATE_TYPES.repositories.PageTemplateBlockRepository,
      useClass: TypeOrmPageTemplateBlockRepository,
    },
    {
      provide:
        TEMPLATE_TYPES.repositories.PageTemplateDatabaseSnapshotRepository,
      useClass: TypeOrmPageTemplateDatabaseSnapshotRepository,
    },
    {
      provide: TEMPLATE_TYPES.repositories.TemplateVersionAssetRepository,
      useClass: TypeOrmTemplateVersionAssetRepository,
    },
    TemplateVersionContentSnapshotService,
    TemplateSnapshotFingerprintService,
    TemplatePreviewLoader,
    TemplateThumbnailProcessor,
    InternalTemplateRenderGuard,
  ],
  controllers: [],
  exports: [
    TEMPLATE_TYPES.ports.Content,
    TEMPLATE_TYPES.ports.Versions,
    TEMPLATE_TYPES.applications.CreatePageTemplateHandler,
    TEMPLATE_TYPES.applications.UpdatePageTemplateHandler,
    TEMPLATE_TYPES.applications.ArchivePageTemplateHandler,
    TEMPLATE_TYPES.applications.RestorePageTemplateHandler,
    TEMPLATE_TYPES.applications.CreateTemplateVersionHandler,
    TEMPLATE_TYPES.applications.ReplaceTemplateBlocksHandler,
    TEMPLATE_TYPES.applications.PublishTemplateVersionHandler,
    TEMPLATE_TYPES.applications.GetPageTemplateHandler,
    TEMPLATE_TYPES.applications.GetTemplateVersionHandler,
    TEMPLATE_TYPES.applications.ListTemplateVersionsHandler,
    TEMPLATE_TYPES.applications.GetTemplateVersionBlocksHandler,
    TEMPLATE_TYPES.applications.GetTemplatePreviewHandler,
    TEMPLATE_TYPES.applications.GetInternalTemplateRenderHandler,
    TEMPLATE_TYPES.applications.ListPageTemplatesHandler,
    TEMPLATE_TYPES.applications.GenerateTemplateVersionThumbnailHandler,
    TEMPLATE_TYPES.applications.GetTemplateVersionThumbnailHandler,
    TEMPLATE_TYPES.services.TemplateThumbnailRenderer,
    TEMPLATE_TYPES.services.TemplateThumbnailJobQueue,
    PERSISTENCE_TYPES.UnitOfWork,
    TEMPLATE_TYPES.repositories.PageTemplateRepository,
    TEMPLATE_TYPES.repositories.TemplateVersionRepository,
    TEMPLATE_TYPES.repositories.PageTemplateBlockRepository,
    TEMPLATE_TYPES.repositories.PageTemplateDatabaseSnapshotRepository,
    TEMPLATE_TYPES.repositories.TemplateVersionAssetRepository,
    TemplatePreviewLoader,
    InternalTemplateRenderGuard,
  ],
})
export class TemplateContentModule {}
