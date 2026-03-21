import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [TypeOrmModule.forFeature([Board])],
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
    // Repo
    {
      provide: BOARD_TYPES.repositories.CreateBoardRepository,
      useClass: CreateBoardRepositoryImpl,
    },
    {
      provide: BOARD_TYPES.repositories.FindBoardRepository,
      useClass: FindBoardRepositoryImpl,
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
  ],
  exports: [BOARD_TYPES.services.CreateBoardService],
})
export class BoardsModule {}
