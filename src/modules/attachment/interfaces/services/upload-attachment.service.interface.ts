import { AttachmentModel } from '../../domain/models/attachment.model';

export interface UploadAttachmentService {
  execute(
    file: Express.Multer.File,
    workspaceId: string,
    taskId: string | null,
    commentId: string | null,
    userId: string,
  ): Promise<AttachmentModel>;
}
