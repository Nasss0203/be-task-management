import { EntityManager } from 'typeorm';

export interface DeleteBoardService {
  softDeleteBoard(
    input: {
      boardId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void>;

  restoreBoard(
    input: {
      boardId: string;
    },
    manager?: EntityManager,
  ): Promise<void>;
}
