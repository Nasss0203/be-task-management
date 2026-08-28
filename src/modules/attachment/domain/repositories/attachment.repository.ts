import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AttachmentAggregate } from '../aggregates/attachment.aggregate';

export interface AttachmentRepository {
  save(
    attachment: AttachmentAggregate,
    context?: PersistenceContext,
  ): Promise<AttachmentAggregate>;

  findReadyById(
    id: string,
    context?: PersistenceContext,
  ): Promise<AttachmentAggregate | null>;

  findReadyByTaskId(
    taskId: string,
    context?: PersistenceContext,
  ): Promise<AttachmentAggregate[]>;

  delete(id: string, context?: PersistenceContext): Promise<void>;
}
