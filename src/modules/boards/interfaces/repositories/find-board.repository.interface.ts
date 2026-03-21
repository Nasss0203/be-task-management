import { EntityManager } from 'typeorm';
import { BoardModel } from '../../domain/models/board.model';

export interface FindBoardRepository {
  findById(id: string, manager?: EntityManager): Promise<BoardModel | null>;
  findAllByProjectId(
    params: {
      projectId: string;
      workspaceId: string;
    },
    manager?: EntityManager,
  ): Promise<BoardModel[]>;
}
