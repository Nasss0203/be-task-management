import { EntityManager } from 'typeorm';

export interface DeletePageBlockRepository {
  softDeletePageBlock(
    input: {
      blockId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void>;

  restorePageBlock(
    input: {
      blockId: string;
    },
    manager?: EntityManager,
  ): Promise<void>;
}
