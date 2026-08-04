import { EntityManager } from 'typeorm';

export interface DeleteTaskCommentRepository {
  delete(id: string, manager?: EntityManager): Promise<void>;
}
