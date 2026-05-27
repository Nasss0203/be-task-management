import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module';
import { PageBlockController } from './controller/page_block.controller';
import { PageBlock } from './domain/entities/page_block.entity';
import { PAGE_BLOCK_TYPES } from './interfaces/types';

import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { WORKSPACE_TYPES } from '../workspaces/interfaces/types';
import { CreatePageBlockApplicationImpl } from './applications/create-page_block.application';
import { UpdatePageBlockApplicationImpl } from './applications/update.page_block.application';
import { CreatePageBlockRepositoryImpl } from './repositories/create.page_block.repository';
import { FindPageBlockRepositoryImpl } from './repositories/find.page_block.repository';
import { UpdatePageBlockRepositoryImpl } from './repositories/update.page_block.repository';
import { CreatePageBlockServiceImpl } from './services/create.page_block.service';
import { FindPageBlockServiceImpl } from './services/find.page_block.service';
import { UpdatePageBlockServiceImpl } from './services/update.page_block.service';
import { FindPageBlockApplicationImpl } from './applications/find.page_block.application';
import { DeletePageBlockApplicationImpl } from './applications/delete.page-block.application';
import { DeletePageBlockRepositoryImpl } from './repositories/delete.page-block.repository';
import { DeletePageBlockServiceImpl } from './services/delete.page-block.service';

@Module({
  imports: [TypeOrmModule.forFeature([PageBlock]), ActivityModule],
  controllers: [PageBlockController],
  providers: [
    //application
    {
      provide: PAGE_BLOCK_TYPES.applications.UpdatePageBlockApplication,
      useClass: UpdatePageBlockApplicationImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.applications.CreatePageBlockApplication,
      useClass: CreatePageBlockApplicationImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.applications.FindPageBlockApplication,
      useClass: FindPageBlockApplicationImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.applications.DeletePageBlockApplication,
      useClass: DeletePageBlockApplicationImpl,
    },
    // Repository
    {
      provide: PAGE_BLOCK_TYPES.repositories.UpdatePageBlockRepository,
      useClass: UpdatePageBlockRepositoryImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.repositories.CreatePageBlockRepository,
      useClass: CreatePageBlockRepositoryImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.repositories.FindPageBlockRepository,
      useClass: FindPageBlockRepositoryImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.repositories.DeletePageBlockRepository,
      useClass: DeletePageBlockRepositoryImpl,
    },
    // Serivice
    {
      provide: PAGE_BLOCK_TYPES.services.CreatePageBlockService,
      useClass: CreatePageBlockServiceImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.services.UpdatePageBlockService,
      useClass: UpdatePageBlockServiceImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.services.FindPageBlockService,
      useClass: FindPageBlockServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
    {
      provide: PAGE_BLOCK_TYPES.services.DeletePageBlockService,
      useClass: DeletePageBlockServiceImpl,
    },
  ],
  exports: [
    PAGE_BLOCK_TYPES.services.CreatePageBlockService,
    PAGE_BLOCK_TYPES.services.UpdatePageBlockService,
    PAGE_BLOCK_TYPES.services.FindPageBlockService,
  ],
})
export class PageBlockModule {}
