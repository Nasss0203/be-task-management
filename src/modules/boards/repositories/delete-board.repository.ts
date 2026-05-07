import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Board } from '../domain/entities/board.entity';
import { DeleteBoardRepository } from '../interfaces/repositories/delete-board.repository.interface';

@Injectable()
export class DeleteBoardRepositoryImpl implements DeleteBoardRepository {
  constructor(
    @InjectRepository(Board)
    private readonly repo: Repository<Board>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Board> {
    return manager ? manager.getRepository(Board) : this.repo;
  }

  async softDeleteBoard(
    input: {
      boardId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.boardId },
      {
        deletedAt: new Date(),
        deletedBy: input.deletedBy,
      },
    );
  }

  async restoreBoard(
    input: {
      boardId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.boardId },
      {
        deletedAt: null,
        deletedBy: null,
      },
    );
  }
}
