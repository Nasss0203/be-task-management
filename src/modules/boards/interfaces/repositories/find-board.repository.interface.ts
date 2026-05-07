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

  findDeletedBoards(
    workspaceId: string,
    projectId?: string,
  ): Promise<BoardModel[]>;

  findOneBoardForRestore(
    workspaceId: string,
    projectId: string,
    boardId: string,
  ): Promise<BoardRestoreLookup | null>;
}

export type BoardRestoreLookup = {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  deletedAt: Date | null;
  workspaceDeletedAt: Date | null;
  projectDeletedAt: Date | null;
};
