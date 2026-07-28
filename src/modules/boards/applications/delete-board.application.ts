import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { type UpdatePageBlockService } from 'src/modules/page_block/interfaces/services/update.page_block.service.interface';
import { type FindPageBlockService } from 'src/modules/page_block/interfaces/services/find.page_block.service.interface';
import { type EntityManager } from 'typeorm';
import { DeleteBoardApplication } from '../interfaces/applications/delete-board.application.interface';
import { type DeleteBoardService } from '../interfaces/services/delete-board.service.interface';
import { type FindBoardService } from '../interfaces/services/find-board.service.interface';
import { BOARD_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteBoardApplicationImpl implements DeleteBoardApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(BOARD_TYPES.services.FindBoardService)
    private readonly findBoardService: FindBoardService,

    @Inject(BOARD_TYPES.services.DeleteBoardService)
    private readonly deleteBoardService: DeleteBoardService,

    @Inject(PAGE_BLOCK_TYPES.services.FindPageBlockService)
    private readonly findPageBlockService: FindPageBlockService,

    @Inject(PAGE_BLOCK_TYPES.services.UpdatePageBlockService)
    private readonly updatePageBlockService: UpdatePageBlockService,
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

    await this.uow.runInTransaction(async (manager) => {
      await this.deleteBoardService.softDeleteBoard(
        {
          boardId: input.boardId,
          deletedBy: input.userId,
        },
        manager,
      );

      await this.clearDefaultBoardReferences(input.boardId, manager);
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

  private async clearDefaultBoardReferences(
    boardId: string,
    manager: EntityManager,
  ): Promise<void> {
    const blocks =
      await this.findPageBlockService.findActiveDatabaseViewBlocksByBoardId(
        boardId,
        manager,
      );

    for (const block of blocks) {
      const currentConfig = Array.isArray(block.data_config)
        ? block.data_config[0]
        : block.data_config;

      if (
        !currentConfig ||
        Array.isArray(currentConfig) ||
        typeof currentConfig !== 'object'
      ) {
        continue;
      }

      await this.updatePageBlockService.update(
        {
          id: block.id,
          data_config: {
            ...currentConfig,
            default_board_id: null,
          },
        },
        manager,
      );
    }
  }
}
