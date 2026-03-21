import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BoardResponseDto } from '../dto/response/board.response.dto';
import { FindBoardApplication } from '../interfaces/applications/find-board.application.interface';
import { type FindBoardService } from '../interfaces/services/find-board.service.interface';
import { BOARD_TYPES } from '../interfaces/types';
import { BoardMapper } from '../mapper/boards.mapper';

@Injectable()
export class FindBoardApplicationImpl implements FindBoardApplication {
  constructor(
    @Inject(BOARD_TYPES.services.FindBoardService)
    private readonly service: FindBoardService,
  ) {}

  async findById(id: string): Promise<BoardResponseDto> {
    const board = await this.service.findById(id);

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return BoardMapper.toResponse(board);
  }

  async findAllByProjectId(
    projectId: string,
    workspaceId: string,
  ): Promise<BoardResponseDto[]> {
    const boards = await this.service.findAllByProjectId(
      projectId,
      workspaceId,
    );
    return boards.map(BoardMapper.toResponse);
  }
}
