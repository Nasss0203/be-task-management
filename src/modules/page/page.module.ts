import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module';
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
import { DeletePageApplicationImpl } from './applications/delete.page.application';
import { DeletePageServiceImpl } from './services/delete.page.service';
import { DeletePageRepositoryImpl } from './repositories/delete-page.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Page]), PageBlockModule, ActivityModule],
  controllers: [PageController],
  providers: [
    PageService,
    // Application
    {
      provide: PAGE_TYPES.applications.FindPageApplication,
      useClass: FindPageApplicationImpl,
    },
    {
      provide: PAGE_TYPES.applications.DeletePageApplication,
      useClass: DeletePageApplicationImpl,
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
    {
      provide: PAGE_TYPES.repositories.DeletePageRepository,
      useClass: DeletePageRepositoryImpl,
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
    {
      provide: PAGE_TYPES.services.DeletePageService,
      useClass: DeletePageServiceImpl,
    },
  ],
  exports: [
    PAGE_TYPES.services.CreatePageService,
    PAGE_TYPES.services.FindPageService,
  ],
})
export class PageModule {}
