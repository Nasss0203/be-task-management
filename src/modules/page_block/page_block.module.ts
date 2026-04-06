import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageBlockController } from './controller/page_block.controller';
import { PageBlock } from './domain/entities/page_block.entity';
import { PAGE_BLOCK_TYPES } from './interfaces/types';

import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { WORKSPACE_TYPES } from '../workspaces/interfaces/types';
import { UpdatePageBlockApplicationImpl } from './applications/update.page_block.application';
import { CreatePageBlockRepositoryImpl } from './repositories/create.page_block.repository';
import { UpdatePageBlockRepositoryImpl } from './repositories/update.page_block.repository';
import { CreatePageBlockServiceImpl } from './services/create.page_block.service';
import { UpdatePageBlockServiceImpl } from './services/update.page_block.service';

@Module({
  imports: [TypeOrmModule.forFeature([PageBlock])],
  controllers: [PageBlockController],
  providers: [
    //application
    {
      provide: PAGE_BLOCK_TYPES.applications.UpdatePageBlockApplication,
      useClass: UpdatePageBlockApplicationImpl,
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
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    PAGE_BLOCK_TYPES.services.CreatePageBlockService,
    PAGE_BLOCK_TYPES.services.UpdatePageBlockService,
  ],
})
export class PageBlockModule {}
