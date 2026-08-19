import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONTENT_TYPES } from './content.types';

// ORM Entities
import { PageOrmEntity } from './infrastructure/persistence/typeorm/entities/page.orm-entity';
import { PageBlockOrmEntity } from './infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageTemplateOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { PageTemplateBlockOrmEntity } from './infrastructure/persistence/typeorm/entities/page-template-block.orm-entity';

// Repositories
import { TypeOrmPageRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page.repository';
import { TypeOrmPageBlockRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-block.repository';
import { TypeOrmPageTemplateRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template.repository';
import { TypeOrmPageTemplateBlockRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-page-template-block.repository';

// Page Handlers
import { CreatePageHandler } from './application/commands/page/create-page.handler';
import { UpdatePageHandler } from './application/commands/page/update-page.handler';
import { DeletePageHandler } from './application/commands/page/delete-page.handler';
import { FindPageHandler } from './application/queries/page/find-page.handler';

// PageBlock Handlers
import { CreatePageBlockHandler } from './application/commands/page/create-page-block.handler';
import { UpdatePageBlockHandler } from './application/commands/page/update-page-block.handler';
import { DeletePageBlockHandler } from './application/commands/page/delete-page-block.handler';
import { FindPageBlockHandler } from './application/queries/page/find-page-block.handler';

// PageTemplate Handlers
import { FindPageTemplateHandler } from './application/queries/page-template/find-page-template.handler';

// PageTemplateBlock Handlers
import { FindPageTemplateBlockHandler } from './application/queries/page-template/find-page-template-block.handler';

// Controllers
import { PageController } from './presentation/http/controllers/page.controller';
import { PageBlockController } from './presentation/http/controllers/page-block.controller';
import { PageTemplatesController } from './presentation/http/controllers/page-templates.controller';
import { PageTemplateBlocksController } from './presentation/http/controllers/page-template-blocks.controller';

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
    provide: CONTENT_TYPES.applications.FindPageHandler,
    useClass: FindPageHandler,
  },
];

const pageBlockHandlers = [
  {
    provide: CONTENT_TYPES.applications.CreatePageBlockHandler,
    useClass: CreatePageBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.UpdatePageBlockHandler,
    useClass: UpdatePageBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.DeletePageBlockHandler,
    useClass: DeletePageBlockHandler,
  },
  {
    provide: CONTENT_TYPES.applications.FindPageBlockHandler,
    useClass: FindPageBlockHandler,
  },
];

const pageTemplateHandlers = [
  {
    provide: CONTENT_TYPES.applications.FindPageTemplateHandler,
    useClass: FindPageTemplateHandler,
  },
  {
    provide: CONTENT_TYPES.applications.FindPageTemplateBlockHandler,
    useClass: FindPageTemplateBlockHandler,
  },
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PageOrmEntity,
      PageBlockOrmEntity,
      PageTemplateOrmEntity,
      PageTemplateBlockOrmEntity,
    ]),
  ],
  controllers: [
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
  ],
  exports: [
    CONTENT_TYPES.applications.CreatePageHandler,
    CONTENT_TYPES.repositories.PageRepository,
    CONTENT_TYPES.repositories.PageBlockRepository,
  ],
})
export class ContentModule {}
