import { EntityManager } from 'typeorm';

export interface UpdateTaskCommentRepository {
  update(id: string, content: string, manager?: EntityManager): Promise<void>;
}
