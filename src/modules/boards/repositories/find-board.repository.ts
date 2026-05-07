import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Board } from '../domain/entities/board.entity';
import { BoardModel } from '../domain/models/board.model';
import {
  BoardRestoreLookup,
  FindBoardRepository,
} from '../interfaces/repositories/find-board.repository.interface';
import { BoardMapper } from '../mapper/boards.mapper';

@Injectable()
export class FindBoardRepositoryImpl implements FindBoardRepository {
  constructor(
    @InjectRepository(Board)
    private readonly repo: Repository<Board>,
  ) {}
  async findDeletedBoards(
    workspaceId: string,
    projectId?: string,
  ): Promise<BoardModel[]> {
    const qb = this.repo
      .createQueryBuilder('board')
      .withDeleted()
      .innerJoin('board.project', 'project')
      .innerJoin('board.workspace', 'workspace')
      .where('board.workspace_id = :workspaceId', { workspaceId })
      .andWhere('board.deleted_at IS NOT NULL')
      .andWhere('project.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .orderBy('board.deleted_at', 'DESC');

    if (projectId) {
      qb.andWhere('board.project_id = :projectId', { projectId });
    }

    const entities = await qb.getMany();

    return entities.map((entity) => BoardMapper.toModel(entity));
  }

  async findOneBoardForRestore(
    workspaceId: string,
    projectId: string,
    boardId: string,
  ): Promise<BoardRestoreLookup | null> {
    const row = await this.repo
      .createQueryBuilder('board')
      .withDeleted()
      .innerJoin('board.project', 'project')
      .innerJoin('board.workspace', 'workspace')
      .select([
        'board.id AS "id"',
        'board.workspace_id AS "workspaceId"',
        'board.project_id AS "projectId"',
        'board.name AS "name"',
        'board.deleted_at AS "deletedAt"',
        'workspace.deleted_at AS "workspaceDeletedAt"',
        'project.deleted_at AS "projectDeletedAt"',
      ])
      .where('board.id = :boardId', { boardId })
      .andWhere('board.workspace_id = :workspaceId', { workspaceId })
      .andWhere('board.project_id = :projectId', { projectId })
      .andWhere('project.workspace_id = :workspaceId', { workspaceId })
      .getRawOne<BoardRestoreLookup>();

    return row ?? null;
  }

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
