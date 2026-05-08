import { Module } from '@nestjs/common';
import { PageTemplatesController } from './controller/page_templates.controller';

@Module({
  controllers: [PageTemplatesController],
  providers: [],
})
export class PageTemplatesModule {}
