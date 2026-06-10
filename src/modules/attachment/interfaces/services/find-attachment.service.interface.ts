import { AttachmentModel } from '../../domain/models/attachment.model';

export interface FindAttachmentService {
  findReadyById(id: string): Promise<AttachmentModel | null>;
  findByTask(taskId: string): Promise<AttachmentModel[]>;
}
