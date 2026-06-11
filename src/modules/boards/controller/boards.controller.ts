import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { BoardsService } from '../boards.service';
import { CreateBoardAndAttachDto } from '../dto/create-board-and-attach.dto';
import { CreateBoardDto } from '../dto/create-board.dto';
import { BoardResponseDto } from '../dto/response/board.response.dto';
import { type CreateBoardAndAttachToPageApplication } from '../interfaces/applications/create-board-page.application.interface';
import { type CreateBoardApplication } from '../interfaces/applications/create-board.application.interface';
import { type DeleteBoardApplication } from '../interfaces/applications/delete-board.application.interface';
import { type FindBoardApplication } from '../interfaces/applications/find-board.application.interface';
import { BOARD_TYPES } from '../interfaces/types';

@Controller('boards')
export class BoardsController {
  constructor(
    private readonly boardsService: BoardsService,
    @Inject(BOARD_TYPES.applications.FindBoardApplication)
    private readonly app: FindBoardApplication,
    @Inject(BOARD_TYPES.applications.CreateBoardApplication)
    private readonly createBoardApplication: CreateBoardApplication,

    @Inject(BOARD_TYPES.applications.CreateBoardAndAttachToPageApplication)
    private readonly createBoardAndAttachToPageApplication: CreateBoardAndAttachToPageApplication,

    @Inject(BOARD_TYPES.applications.DeleteBoardApplication)
    private readonly deleteBoardApplication: DeleteBoardApplication,

    @Inject(BOARD_TYPES.applications.FindBoardApplication)
    private readonly findBoardApplication: FindBoardApplication,
  ) {}

  @Get('trash')
  @RequirePermissions(PERMISSIONS.BOARD_READ)
  async findDeletedBoards(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.findBoardApplication.findDeletedBoards(workspaceId, projectId);
  }

  @Get(':id')
  @WorkspaceContext({ source: 'resource', type: 'board', key: 'id' })
  @RequirePermissions(PERMISSIONS.BOARD_READ)
  @ResponseMessage('Find board by id')
  async findById(@Param('id') id: string): Promise<BoardResponseDto> {
    return this.app.findById(id);
  }

  @Get('/workspace/:workspaceId/project/:projectId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.BOARD_READ)
  @ResponseMessage('Find all board')
  async findAllByProjectId(
    @Param('projectId') projectId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<BoardResponseDto[]> {
    return await this.app.findAllByProjectId(projectId, workspaceId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.BOARD_CREATE)
  @ResponseMessage('Create board')
  create(@Body() createBoardDto: CreateBoardDto, @Auth() auth: IAuth) {
    return this.createBoardApplication.create({
      ...createBoardDto,
      createdBy: auth.id,
    });
  }

  @Post('create-and-attach')
  @RequirePermissions(PERMISSIONS.BOARD_CREATE, PERMISSIONS.PAGE_BLOCK_UPDATE)
  @ResponseMessage('Create board and attach')
  createAndAttachToPage(
    @Body() dto: CreateBoardAndAttachDto,
    @Auth() auth: IAuth,
  ): Promise<BoardResponseDto> {
    return this.createBoardAndAttachToPageApplication.execute({
      ...dto,
      createdBy: auth.id,
    });
  }

  @Delete('workspaces/:workspaceId/projects/:projectId/boards/:boardId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.BOARD_DELETE)
  async deleteBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('boardId') boardId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteBoardApplication.delete({
      workspaceId,
      projectId,
      boardId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }

  @Patch('workspaces/:workspaceId/projects/:projectId/boards/:boardId/restore')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.BOARD_DELETE)
  async restoreBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('boardId') boardId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteBoardApplication.restore({
      workspaceId,
      projectId,
      boardId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }
}
