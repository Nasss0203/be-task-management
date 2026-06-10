import { AttachmentModel } from '../../domain/models/attachment.model';
import { SaveAttachmentInput } from './attachment.repository.interface';

export interface UploadAttachmentRepository {
  save(input: SaveAttachmentInput): Promise<AttachmentModel>;
}
