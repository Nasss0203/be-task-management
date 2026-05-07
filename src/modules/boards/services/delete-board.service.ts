import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BOARD_TYPES } from '../interfaces/types';
import { type DeleteBoardRepository } from '../interfaces/repositories/delete-board.repository.interface';
import { DeleteBoardService } from '../interfaces/services/delete-board.service.interface';

@Injectable()
export class DeleteBoardServiceImpl implements DeleteBoardService {
  constructor(
    @Inject(BOARD_TYPES.repositories.DeleteBoardRepository)
    private readonly deleteBoardRepository: DeleteBoardRepository,
  ) {}

  softDeleteBoard(
    input: {
      boardId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deleteBoardRepository.softDeleteBoard(input, manager);
  }

  restoreBoard(
    input: {
      boardId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deleteBoardRepository.restoreBoard(input, manager);
  }
}
