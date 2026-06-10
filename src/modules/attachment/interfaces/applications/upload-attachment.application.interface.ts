import { AttachmentResponseDto } from '../../dto/response/attachment.response.dto';
import { UploadAttachmentDto } from '../../dto/create-attachment.dto';

export interface UploadAttachmentApplication {
  execute(
    file: Express.Multer.File,
    body: UploadAttachmentDto,
    userId: string,
  ): Promise<AttachmentResponseDto>;
}
