import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsService } from './boards.service';
import { BoardsController } from './controller/boards.controller';
import { Board } from './domain/entities/board.entity';
import { BOARD_TYPES } from './interfaces/types';
import { CreateBoardRepositoryImpl } from './repositories/create.boards.repository';
import { CreateBoardServiceImpl } from './services/create.boards.service';

@Module({
  imports: [TypeOrmModule.forFeature([Board])],
  controllers: [BoardsController],
  providers: [
    BoardsService,
    {
      provide: BOARD_TYPES.repositories.CreateBoardRepository,
      useClass: CreateBoardRepositoryImpl,
    },
    {
      provide: BOARD_TYPES.services.CreateBoardService,
      useClass: CreateBoardServiceImpl,
    },
  ],
  exports: [BOARD_TYPES.services.CreateBoardService],
})
export class BoardsModule {}
