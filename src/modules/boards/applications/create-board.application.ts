import { Inject, Injectable } from '@nestjs/common';
import { CreateBoardDto } from '../dto/create-board.dto';
import { BoardResponseDto } from '../dto/response/board.response.dto';
import { CreateBoardApplication } from '../interfaces/applications/create-board.application.interface';
import { type CreateBoardService } from '../interfaces/services/create.board.service.interface';
import { BOARD_TYPES } from '../interfaces/types';
import { BoardMapper } from '../mapper/boards.mapper';

@Injectable()
export class CreateBoardApplicationImpl implements CreateBoardApplication {
  constructor(
    @Inject(BOARD_TYPES.services.CreateBoardService)
    private readonly service: CreateBoardService,
  ) {}
  async create(createBoardDto: CreateBoardDto): Promise<BoardResponseDto> {
    const model = await this.service.create(createBoardDto);

    return BoardMapper.toResponse(model);
  }
}
