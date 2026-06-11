import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageTemplateBlocksController } from './controller/page_template_blocks.controller';
import { PageTemplateBlock } from './domain/entities/page_template_block.entity';
import { PAGE_TEMPLATE_BLOCK_TYPES } from './interfaces/types';
import { PageTemplateBlocksRepositoryImpl } from './repositories/page_template_blocks.repository';
import { PageTemplateBlocksServiceImpl } from './services/page_template_blocks.service';

const pageTemplateBlocksRepository = {
  provide: PAGE_TEMPLATE_BLOCK_TYPES.repositories.PageTemplateBlocksRepository,
  useClass: PageTemplateBlocksRepositoryImpl,
};

const pageTemplateBlocksService = {
  provide: PAGE_TEMPLATE_BLOCK_TYPES.services.PageTemplateBlocksService,
  useClass: PageTemplateBlocksServiceImpl,
};

@Module({
  imports: [TypeOrmModule.forFeature([PageTemplateBlock])],
  controllers: [PageTemplateBlocksController],
  providers: [pageTemplateBlocksRepository, pageTemplateBlocksService],
  exports: [pageTemplateBlocksService],
})
export class PageTemplateBlocksModule {}
