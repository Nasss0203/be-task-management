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
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { BoardsService } from '../boards.service';
import { CreateBoardDto } from '../dto/create-board.dto';
import { BoardResponseDto } from '../dto/response/board.response.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { type FindBoardApplication } from '../interfaces/applications/find-board.application.interface';
import { BOARD_TYPES } from '../interfaces/types';

@Controller('boards')
export class BoardsController {
  constructor(
    private readonly boardsService: BoardsService,
    @Inject(BOARD_TYPES.applications.FindBoardApplication)
    private readonly app: FindBoardApplication,
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
  create(@Body() createBoardDto: CreateBoardDto) {
    return this.boardsService.create(createBoardDto);
  }

  @Get()
  findAll() {
    return this.boardsService.findAll();
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
