import { BoardModel } from '../../domain/models/board.model';

export interface FindBoardService {
  findById(id: string): Promise<BoardModel | null>;
  findAllByProjectId(
    projectId: string,
    workspaceId: string,
  ): Promise<BoardModel[]>;
}
