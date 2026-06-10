import { AttachmentModel } from '../../domain/models/attachment.model';

export interface UpdateAttachmentService {
  execute(
    id: string,
    data: Partial<AttachmentModel>,
  ): Promise<AttachmentModel>;
}
