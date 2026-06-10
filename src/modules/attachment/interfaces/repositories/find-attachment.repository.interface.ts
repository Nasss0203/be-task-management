import { AttachmentModel } from '../../domain/models/attachment.model';

export interface FindAttachmentRepository {
  findReadyById(id: string): Promise<AttachmentModel | null>;

  findByTask(taskId: string): Promise<AttachmentModel[]>;
}
