import { EntityManager } from 'typeorm';

export interface DeletePageBlockService {
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
