import { AttachmentResponseDto } from '../../dto/response/attachment.response.dto';
import { UpdateAttachmentDto } from '../../dto/update-attachment.dto';

export interface UpdateAttachmentApplication {
  execute(
    id: string,
    data: UpdateAttachmentDto,
    userId: string,
  ): Promise<AttachmentResponseDto>;
}
