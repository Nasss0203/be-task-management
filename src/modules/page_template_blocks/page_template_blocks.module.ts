import { Module } from '@nestjs/common';
import { PageTemplateBlocksController } from './controller/page_template_blocks.controller';

@Module({
  controllers: [PageTemplateBlocksController],
  providers: [],
})
export class PageTemplateBlocksModule {}
