import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageTemplatesController } from './controller/page_templates.controller';
import { PageTemplate } from './domain/entities/page_template.entity';
import { PAGE_TEMPLATE_TYPES } from './interfaces/types';
import { PageTemplatesRepositoryImpl } from './repositories/page_templates.repository';
import { PageTemplatesServiceImpl } from './services/page_templates.service';

const pageTemplatesRepository = {
  provide: PAGE_TEMPLATE_TYPES.repositories.PageTemplatesRepository,
  useClass: PageTemplatesRepositoryImpl,
};

const pageTemplatesService = {
  provide: PAGE_TEMPLATE_TYPES.services.PageTemplatesService,
  useClass: PageTemplatesServiceImpl,
};

@Module({
  imports: [TypeOrmModule.forFeature([PageTemplate])],
  controllers: [PageTemplatesController],
  providers: [pageTemplatesRepository, pageTemplatesService],
  exports: [pageTemplatesService],
})
export class PageTemplatesModule {}
