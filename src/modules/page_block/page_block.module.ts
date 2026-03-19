import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageBlock } from './domain/entities/page_block.entity';
import { PAGE_BLOCK_TYPES } from './interfaces/types';
import { PageBlockController } from './page_block.controller';
import { PageBlockService } from './page_block.service';
import { CreatePageBlockRepositoryImpl } from './repositories/create.page_block.repository';
import { CreatePageBlockServiceImpl } from './services/create.page_block.service';

@Module({
  imports: [TypeOrmModule.forFeature([PageBlock])],
  controllers: [PageBlockController],
  providers: [
    PageBlockService,
    {
      provide: PAGE_BLOCK_TYPES.repositories.CreatePageBlockRepository,
      useClass: CreatePageBlockRepositoryImpl,
    },
    {
      provide: PAGE_BLOCK_TYPES.services.CreatePageBlockService,
      useClass: CreatePageBlockServiceImpl,
    },
  ],
  exports: [PAGE_BLOCK_TYPES.services.CreatePageBlockService],
})
export class PageBlockModule {}
