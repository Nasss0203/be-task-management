import { EntityManager, Repository } from 'typeorm';
import { Board } from '../../domain/entities/board.entity';
import { BoardModel } from '../../domain/models/board.model';

export type SaveBoardInput = Pick<
  BoardModel,
  'createdBy' | 'name' | 'viewType' | 'workspaceId' | 'projectId'
> &
  Partial<Pick<BoardModel, 'createdAt' | 'updatedAt' | 'updatedBy' | 'id'>>;

export interface CreateBoardRepository {
  resolveRepo(manager?: EntityManager): Repository<Board>;

  save(
    page: BoardModel | SaveBoardInput,
    manager: EntityManager,
  ): Promise<BoardModel>;
}
