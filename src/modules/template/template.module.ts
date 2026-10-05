import { Module } from '@nestjs/common';
import { TemplateVersionContentSnapshotService } from './application/services/template-version-content-snapshot.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { DatabaseModule } from 'src/modules/database/database.module';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { ContentModule } from '../content/content.module';
import { PermissionModule } from '../permission/permission.module';
import { ArchivePageTemplateHandler } from './application/commands/page-template/archive-page-template/archive-page-template.handler';
import { CreatePageTemplateHandler } from './application/commands/page-template/create-page-template/create-page-template.handler';
import { RestorePageTemplateHandler } from './application/commands/page-template/restore-page-template/restore-page-template.handler';
import { UpdatePageTemplateHandler } from './application/commands/page-template/update-page-template/update-page-template.handler';
import { UseTemplateHandler } from './application/commands/page-template/use-template/use-template.handler';
import { ReplaceTemplateBlocksHandler } from './application/commands/template-block/replace-template-blocks/replace-template-blocks.handler';
import { CreateTemplateVersionHandler } from './application/commands/template-version/create-template-version/create-template-version.handler';
import { PublishTemplateVersionHandler } from './application/commands/template-version/publish-template-version/publish-template-version.handler';
import { GetPageTemplateHandler } from './application/queries/page-template/get-page-template/get-page-template.handler';
import { ListPageTemplatesHandler } from './application/queries/page-template/list-page-templates/list-page-templates.handler';
import { GetTemplateVersionBlocksHandler } from './application/queries/template-block/get-template-version-blocks/get-template-version-blocks.handler';
import { GetTemplatePreviewHandler } from './application/queries/template-preview/get-template-preview/get-template-preview.handler';
import { GetTemplateVersionHandler } from './application/queries/template-version/get-template-version/get-template-version.handler';
import { ListTemplateVersionsHandler } from './application/queries/template-version/list-template-versions/list-template-versions.handler';
import { PageTemplateBlockOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-block.orm-entity';
import { PageTemplateDatabasePropertyOptionOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-property-option.orm-entity';
import { PageTemplateDatabasePropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-property.orm-entity';
import { PageTemplateDatabaseRowValueOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-row-value.orm-entity';
import { PageTemplateDatabaseRowOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-row.orm-entity';
import { PageTemplateDatabaseViewPropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-view-property.orm-entity';
import { PageTemplateDatabaseViewOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database-view.orm-entity';
import { PageTemplateDatabaseOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-database.orm-entity';
import { PageTemplateVersionOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-version.orm-entity';
import { PageTemplateOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { TypeOrmPageTemplateBlockRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template-block.repository';
import { TypeOrmPageTemplateDatabaseSnapshotRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template-database-snapshot.repository';
import { TypeOrmPageTemplateRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template.repository';
import { TypeOrmTemplateVersionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-template-version.repository';
import { TemplateController } from './presentation/http/controllers/template.controller';
import { TEMPLATE_TYPES } from './template.types';

const PageTemplateHandler = [
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
    provide: TEMPLATE_TYPES.applications.UseTemplateHandler,
    useClass: UseTemplateHandler,
  },
  {
    provide: TEMPLATE_TYPES.applications.ListPageTemplatesHandler,
    useClass: ListPageTemplatesHandler,
  },
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PageTemplateOrmEntity,
      PageTemplateVersionOrmEntity,
      PageTemplateBlockOrmEntity,
      PageTemplateDatabaseOrmEntity,
      PageTemplateDatabasePropertyOrmEntity,
      PageTemplateDatabasePropertyOptionOrmEntity,
      PageTemplateDatabaseRowOrmEntity,
      PageTemplateDatabaseRowValueOrmEntity,
      PageTemplateDatabaseViewOrmEntity,
      PageTemplateDatabaseViewPropertyOrmEntity,
    ]),
    ContentModule,
    DatabaseModule,
    PermissionModule,
  ],
  providers: [
    TemplateVersionContentSnapshotService,
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
    ...PageTemplateHandler,
  ],
  controllers: [TemplateController],
  exports: [
    TEMPLATE_TYPES.repositories.PageTemplateRepository,
    TEMPLATE_TYPES.repositories.TemplateVersionRepository,
    TEMPLATE_TYPES.repositories.PageTemplateBlockRepository,
  ],
})
export class TemplateModule {}
