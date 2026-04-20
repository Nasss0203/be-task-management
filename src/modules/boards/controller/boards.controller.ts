import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { BoardsService } from '../boards.service';
import { CreateBoardDto } from '../dto/create-board.dto';
import { BoardResponseDto } from '../dto/response/board.response.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { type CreateBoardAndAttachToPageApplication } from '../interfaces/applications/create-board-page.application.interface';
import { type CreateBoardApplication } from '../interfaces/applications/create-board.application.interface';
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
  ) {}

  @Get(':id')
  @ResponseMessage('Find board by id')
  async findById(@Param('id') id: string): Promise<BoardResponseDto> {
    return this.app.findById(id);
  }

  @Get('/workspace/:workspaceId/project/:projectId')
  @ResponseMessage('Find all board')
  async findAllByProjectId(
    @Param('projectId') projectId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<BoardResponseDto[]> {
    return await this.app.findAllByProjectId(projectId, workspaceId);
  }

  @Post()
  @ResponseMessage('Create board')
  create(@Body() createBoardDto: CreateBoardDto, @Auth() auth: IAuth) {
    return this.createBoardApplication.create({
      ...createBoardDto,
      createdBy: auth.id,
    });
  }

  @Post('create-and-attach')
  @ResponseMessage('Create board and attach')
  createAndAttachToPage(
    @Body() dto: CreateBoardDto,
    @Auth() auth: IAuth,
  ): Promise<BoardResponseDto> {
    return this.createBoardAndAttachToPageApplication.execute({
      ...dto,
      createdBy: auth.id,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardsService.update(+id, updateBoardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boardsService.remove(+id);
  }
}
