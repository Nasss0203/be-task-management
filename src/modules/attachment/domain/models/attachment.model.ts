import {
  AttachmentProvider,
  AttachmentStatus,
} from '../entities/attachment.entity';

export class AttachmentModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly taskId: string | null,
    public readonly commentId: string | null,
    public readonly uploadedBy: string,
    public readonly fileName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly provider: AttachmentProvider,
    public readonly storageKey: string | null,
    public readonly publicId: string | null,
    public readonly url: string | null,
    public readonly secureUrl: string | null,
    public readonly status: AttachmentStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
