import { BoardModel } from '../../domain/models/board.model';
import { BoardRestoreLookup } from '../repositories/find-board.repository.interface';

export interface FindBoardService {
  findById(id: string): Promise<BoardModel | null>;
  findAllByProjectId(
    projectId: string,
    workspaceId: string,
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
