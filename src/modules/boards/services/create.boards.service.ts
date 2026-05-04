import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BoardModel } from '../domain/models/board.model';
import { CreateBoardDto } from '../dto/create-board.dto';
import {
  SaveBoardInput,
  type CreateBoardRepository,
} from '../interfaces/repositories/create.board.repository.interface';
import { CreateBoardService } from '../interfaces/services/create.board.service.interface';
import { BOARD_TYPES } from '../interfaces/types';

@Injectable()
export class CreateBoardServiceImpl implements CreateBoardService {
  constructor(
    @Inject(BOARD_TYPES.repositories.CreateBoardRepository)
    private readonly repo: CreateBoardRepository,
  ) {}

  create(
    createBoardDto: CreateBoardDto,
    manager: EntityManager,
  ): Promise<BoardModel> {
    const { createdBy, ...fields } = createBoardDto;
    if (!createdBy) {
      throw new BadRequestException('createdBy is required');
    }
    const input: SaveBoardInput = { ...fields, createdBy };
    return this.repo.save(input, manager);
  }
}
