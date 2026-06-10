import { AttachmentResponseDto } from '../../dto/response/attachment.response.dto';

export interface FindAttachmentApplication {
  findByTask(taskId: string): Promise<AttachmentResponseDto[]>;
}
