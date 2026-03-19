import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageBlockModule } from '../page_block/page_block.module';
import { PageController } from './controller/page.controller';
import { Page } from './domain/entities/page.entity';
import { PAGE_TYPES } from './interfaces/types';
import { PageService } from './page.service';
import { PageRepositoryImpl } from './repositories/page.repository';
import { CreatePageServiceImpl } from './services/create.page.service';

@Module({
  imports: [TypeOrmModule.forFeature([Page]), PageBlockModule],
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
