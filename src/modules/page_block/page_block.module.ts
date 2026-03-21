import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageBlockController } from './controller/page_block.controller';
import { PageBlock } from './domain/entities/page_block.entity';
import { PAGE_BLOCK_TYPES } from './interfaces/types';

import { CreatePageBlockRepositoryImpl } from './repositories/create.page_block.repository';
import { UpdatePageBlockRepositoryImpl } from './repositories/update.page_block.repository';
import { CreatePageBlockServiceImpl } from './services/create.page_block.service';
import { UpdatePageBlockServiceImpl } from './services/update.page_block.service';

@Module({
  imports: [TypeOrmModule.forFeature([PageBlock])],
  controllers: [PageBlockController],
  providers: [
    // Repository
    {
      provide: PAGE_BLOCK_TYPES.repositories.UpdatePageBlockRepository,
      useClass: UpdatePageBlockRepositoryImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.repositories.CreatePageBlockRepository,
      useClass: CreatePageBlockRepositoryImpl,
    },
    // Serivic
    {
      provide: PAGE_BLOCK_TYPES.services.CreatePageBlockService,
      useClass: CreatePageBlockServiceImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.services.UpdatePageBlockService,
      useClass: UpdatePageBlockServiceImpl,
    },
  ],
  exports: [
    PAGE_BLOCK_TYPES.services.CreatePageBlockService,
    PAGE_BLOCK_TYPES.services.UpdatePageBlockService,
  ],
})
export class PageBlockModule {}
