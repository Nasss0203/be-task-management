import { EntityManager } from 'typeorm';
import { BoardModel } from '../../domain/models/board.model';
import { CreateBoardDto } from '../../dto/create-board.dto';

export interface CreateBoardService {
  create(
    createBoardDto: CreateBoardDto,
    manager: EntityManager,
  ): Promise<BoardModel>;
}
