import { Inject, Injectable } from '@nestjs/common';
import { BoardModel } from '../domain/models/board.model';
import { type FindBoardRepository } from '../interfaces/repositories/find-board.repository.interface';
import { FindBoardService } from '../interfaces/services/find-board.service.interface';
import { BOARD_TYPES } from '../interfaces/types';

@Injectable()
export class FindBoardServiceImpl implements FindBoardService {
  constructor(
    @Inject(BOARD_TYPES.repositories.FindBoardRepository)
    private readonly findBoardRepository: FindBoardRepository,
  ) {}

  async findById(id: string): Promise<BoardModel | null> {
    return this.findBoardRepository.findById(id);
  }
  async findAllByProjectId(
    projectId: string,
    workspaceId: string,
  ): Promise<BoardModel[]> {
    return this.findBoardRepository.findAllByProjectId({
      projectId,
      workspaceId,
    });
  }
}
