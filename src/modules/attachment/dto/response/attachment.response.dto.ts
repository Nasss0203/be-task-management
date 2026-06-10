import {
  AttachmentProvider,
  AttachmentStatus,
} from '../../domain/entities/attachment.entity';

export class AttachmentResponseDto {
  id: string;
  workspaceId: string;
  taskId: string | null;
  commentId: string | null;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  size: number;
  provider: AttachmentProvider;
  storageKey: string | null;
  publicId: string | null;
  url: string | null;
  secureUrl: string | null;
  status: AttachmentStatus;
  createdAt: Date;
  updatedAt: Date;
}
