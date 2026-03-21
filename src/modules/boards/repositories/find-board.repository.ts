import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Board } from '../domain/entities/board.entity';
import { BoardModel } from '../domain/models/board.model';
import { FindBoardRepository } from '../interfaces/repositories/find-board.repository.interface';
import { BoardMapper } from '../mapper/boards.mapper';

@Injectable()
export class FindBoardRepositoryImpl implements FindBoardRepository {
  constructor(
    @InjectRepository(Board)
    private readonly repo: Repository<Board>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Board> {
    return manager ? manager.getRepository(Board) : this.repo;
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<BoardModel | null> {
    const entity = await this.getRepo(manager).findOne({
      where: { id },
    });

    if (!entity) return null;

    return BoardMapper.toModel(entity);
  }
  async findAllByProjectId(
    params: {
      projectId: string;
      workspaceId: string;
    },
    manager?: EntityManager,
  ): Promise<BoardModel[]> {
    const { projectId, workspaceId } = params;
    const entities = await this.getRepo(manager).find({
      where: { projectId: projectId, workspaceId: workspaceId },
    });

    return entities.map((entity) => BoardMapper.toModel(entity));
  }
}
