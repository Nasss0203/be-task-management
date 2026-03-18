import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './domain/entities/page.entity';
import { PAGE_TYPES } from './interfaces/types';
import { PageController } from './page.controller';
import { PageService } from './page.service';
import { PageRepositoryImpl } from './repositories/page.repository';
import { CreatePageServiceImpl } from './services/create.page.service';

@Module({
  imports: [TypeOrmModule.forFeature([Page])],
  controllers: [PageController],
  providers: [
    PageService,
    // {
    //   provide: PAGE_TYPES.applications.CreatePageApplication,
    //   useClass: CreatePageApplicationImpl,
    // },
    {
      provide: PAGE_TYPES.repositories.PageRepository,
      useClass: PageRepositoryImpl,
    },
    {
      provide: PAGE_TYPES.services.CreatePageService,
      useClass: CreatePageServiceImpl,
    },
  ],
  exports: [PAGE_TYPES.services.CreatePageService],
})
export class PageModule {}
