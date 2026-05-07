import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeleteBoardApplication } from '../interfaces/applications/delete-board.application.interface';
import { type DeleteBoardService } from '../interfaces/services/delete-board.service.interface';
import { type FindBoardService } from '../interfaces/services/find-board.service.interface';
import { BOARD_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteBoardApplicationImpl implements DeleteBoardApplication {
  constructor(
    @Inject(BOARD_TYPES.services.FindBoardService)
    private readonly findBoardService: FindBoardService,

    @Inject(BOARD_TYPES.services.DeleteBoardService)
    private readonly deleteBoardService: DeleteBoardService,
  ) {}

  async delete(input: {
    workspaceId: string;
    projectId: string;
    boardId: string;
    userId: string;
  }): Promise<void> {
    const board = await this.findBoardService.findOneBoardForRestore(
      input.workspaceId,
      input.projectId,
      input.boardId,
    );

    if (!board) {
      throw new NotFoundException('Board not found in this project');
    }

    if (board.deletedAt) {
      throw new BadRequestException('Board is already deleted');
    }

    if (board.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot delete board because workspace is deleted',
      );
    }

    if (board.projectDeletedAt) {
      throw new BadRequestException(
        'Cannot delete board because project is deleted',
      );
    }

    await this.deleteBoardService.softDeleteBoard({
      boardId: input.boardId,
      deletedBy: input.userId,
    });
  }

  async restore(input: {
    workspaceId: string;
    projectId: string;
    boardId: string;
    userId: string;
  }): Promise<void> {
    const board = await this.findBoardService.findOneBoardForRestore(
      input.workspaceId,
      input.projectId,
      input.boardId,
    );

    if (!board) {
      throw new NotFoundException('Board not found in this project');
    }

    if (!board.deletedAt) {
      throw new BadRequestException('Board is not deleted');
    }

    if (board.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot restore board because workspace is deleted',
      );
    }

    if (board.projectDeletedAt) {
      throw new BadRequestException(
        'Cannot restore board because project is deleted',
      );
    }

    await this.deleteBoardService.restoreBoard({
      boardId: input.boardId,
    });
  }
}
