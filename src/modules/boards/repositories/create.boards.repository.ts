import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Board } from '../domain/entities/board.entity';
import { BoardModel } from '../domain/models/board.model';
import {
  CreateBoardRepository,
  SaveBoardInput,
} from '../interfaces/repositories/create.board.repository.interface';
import { BoardMapper } from '../mapper/boards.mapper';

@Injectable()
export class CreateBoardRepositoryImpl implements CreateBoardRepository {
  constructor(
    @InjectRepository(Board)
    private readonly repo: Repository<Board>,
  ) {}

  resolveRepo(manager?: EntityManager): Repository<Board> {
    return manager ? manager.getRepository(Board) : this.repo;
  }

  async save(
    page: BoardModel | SaveBoardInput,
    manager: EntityManager,
  ): Promise<BoardModel> {
    const repo = this.resolveRepo(manager);
    const entity = BoardMapper.toEntity(page);
    const saved = await repo.save(entity);

    return BoardMapper.toModel(saved);
  }
}
