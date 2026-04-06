import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageBlockModule } from '../page_block/page_block.module';
import { FindPageApplicationImpl } from './applications/find-page.application';
import { PageController } from './controller/page.controller';
import { Page } from './domain/entities/page.entity';
import { PAGE_TYPES } from './interfaces/types';
import { PageService } from './page.service';
import { FindPageRepositoryImpl } from './repositories/find-page.repository';
import { PageRepositoryImpl } from './repositories/page.repository';
import { CreatePageServiceImpl } from './services/create.page.service';
import { FindPageServiceImpl } from './services/find-page.service';

@Module({
  imports: [TypeOrmModule.forFeature([Page]), PageBlockModule],
  controllers: [PageController],
  providers: [
    PageService,
    // Application
    {
      provide: PAGE_TYPES.applications.FindPageApplication,
      useClass: FindPageApplicationImpl,
    },
    // Repo
    {
      provide: PAGE_TYPES.repositories.PageRepository,
      useClass: PageRepositoryImpl,
    },
    {
      provide: PAGE_TYPES.repositories.FindPageRepository,
      useClass: FindPageRepositoryImpl,
    },
    // Service
    {
      provide: PAGE_TYPES.services.CreatePageService,
      useClass: CreatePageServiceImpl,
    },
    {
      provide: PAGE_TYPES.services.FindPageService,
      useClass: FindPageServiceImpl,
    },
  ],
  exports: [
    PAGE_TYPES.services.CreatePageService,
    PAGE_TYPES.services.FindPageService,
  ],
})
export class PageModule {}
