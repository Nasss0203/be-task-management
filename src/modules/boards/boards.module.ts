import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { PageModule } from '../page/page.module';
import { PageBlockModule } from '../page_block/page_block.module';
import { WORKSPACE_TYPES } from '../workspaces/interfaces/types';
import { CreateBoardAndAttachToPageApplicationImpl } from './applications/create-board-page.application';
import { CreateBoardApplicationImpl } from './applications/create-board.application';
import { FindBoardApplicationImpl } from './applications/find-board.application';
import { BoardsService } from './boards.service';
import { BoardsController } from './controller/boards.controller';
import { Board } from './domain/entities/board.entity';
import { BOARD_TYPES } from './interfaces/types';
import { CreateBoardRepositoryImpl } from './repositories/create.boards.repository';
import { FindBoardRepositoryImpl } from './repositories/find-board.repository';
import { CreateBoardServiceImpl } from './services/create.boards.service';
import { FindBoardServiceImpl } from './services/find-board.service';
import { DeleteBoardApplicationImpl } from './applications/delete-board.application';
import { DeleteBoardServiceImpl } from './services/delete-board.service';
import { DeleteBoardRepositoryImpl } from './repositories/delete-board.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Board]), PageBlockModule, PageModule],
  controllers: [BoardsController],
  providers: [
    BoardsService,
    // Application
    {
      provide: BOARD_TYPES.applications.FindBoardApplication,
      useClass: FindBoardApplicationImpl,
    },
    {
      provide: BOARD_TYPES.applications.CreateBoardApplication,
      useClass: CreateBoardApplicationImpl,
    },
    {
      provide: BOARD_TYPES.applications.CreateBoardAndAttachToPageApplication,
      useClass: CreateBoardAndAttachToPageApplicationImpl,
    },
    {
      provide: BOARD_TYPES.applications.DeleteBoardApplication,
      useClass: DeleteBoardApplicationImpl,
    },
    // Repo
    {
      provide: BOARD_TYPES.repositories.CreateBoardRepository,
      useClass: CreateBoardRepositoryImpl,
    },
    {
      provide: BOARD_TYPES.repositories.FindBoardRepository,
      useClass: FindBoardRepositoryImpl,
    },
    {
      provide: BOARD_TYPES.repositories.DeleteBoardRepository,
      useClass: DeleteBoardRepositoryImpl,
    },
    // Service
    {
      provide: BOARD_TYPES.services.CreateBoardService,
      useClass: CreateBoardServiceImpl,
    },
    {
      provide: BOARD_TYPES.services.FindBoardService,
      useClass: FindBoardServiceImpl,
    },

    {
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
    {
      provide: BOARD_TYPES.services.DeleteBoardService,
      useClass: DeleteBoardServiceImpl,
    },
  ],
  exports: [BOARD_TYPES.services.CreateBoardService],
})
export class BoardsModule {}
