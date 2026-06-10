import { AttachmentModel } from '../../domain/models/attachment.model';
import { SaveAttachmentInput } from './attachment.repository.interface';

export interface UpdateAttachmentRepository {
  update(input: SaveAttachmentInput): Promise<AttachmentModel>;
}
