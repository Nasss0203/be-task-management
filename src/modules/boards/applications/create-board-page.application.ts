import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { type FindPageService } from 'src/modules/page/interfaces/services/find-page.service.interface';
import { PAGE_TYPES } from 'src/modules/page/interfaces/types';
import { type CreatePageBlockService } from 'src/modules/page_block/interfaces/services/create.page_block.service.interface';
import { type FindPageBlockService } from 'src/modules/page_block/interfaces/services/find.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { CreateBoardDto } from '../dto/create-board.dto';
import { BoardResponseDto } from '../dto/response/board.response.dto';
import { CreateBoardAndAttachToPageApplication } from '../interfaces/applications/create-board-page.application.interface';
import { type CreateBoardService } from '../interfaces/services/create.board.service.interface';
import { BOARD_TYPES } from '../interfaces/types';
import { BoardMapper } from '../mapper/boards.mapper';

@Injectable()
export class CreateBoardAndAttachToPageApplicationImpl implements CreateBoardAndAttachToPageApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(BOARD_TYPES.services.CreateBoardService)
    private readonly createBoardService: CreateBoardService,

    @Inject(PAGE_BLOCK_TYPES.services.CreatePageBlockService)
    private readonly createPageBlockService: CreatePageBlockService,

    @Inject(PAGE_TYPES.services.FindPageService)
    private readonly findPageService: FindPageService,

    @Inject(PAGE_BLOCK_TYPES.services.FindPageBlockService)
    private readonly findPageBlockService: FindPageBlockService,
  ) {}

  async execute(dto: CreateBoardDto): Promise<BoardResponseDto> {
    return await this.uow.runInTransaction(async (manager) => {
      const board = await this.createBoardService.create(
        {
          workspaceId: dto.workspaceId,
          projectId: dto.projectId,
          name: dto.name,
          viewType: dto.viewType,
          createdBy: dto.createdBy,
        },
        manager,
      );

      const findPage = await this.findPageService.findPageByWorkspaceId(
        board.createdBy,
        board.workspaceId,
        manager,
      );

      const findPageBlock = await this.findPageBlockService.findAllByPageId(
        findPage.id,
        manager,
      );

      const pageBlockId = findPageBlock?.id as string;

      await this.createPageBlockService.addDatabaseViewToBlock(
        pageBlockId,
        {
          board_id: board.id,
          workspace_id: dto.workspaceId,
          project_id: dto.projectId,
          view_type: dto.viewType,
        },
        manager,
      );

      return BoardMapper.toResponse(board);
    });
  }
}
