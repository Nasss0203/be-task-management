import { EntityManager } from 'typeorm';

export interface DeletePageRepository {
  softDeletePage(
    input: {
      pageId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void>;

  restorePage(
    input: {
      pageId: string;
    },
    manager?: EntityManager,
  ): Promise<void>;
}
