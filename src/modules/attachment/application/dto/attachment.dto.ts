import { AttachmentAggregate } from '../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';
import { AttachmentStatus } from '../../domain/enums/attachment-status.enum';

export class AttachmentDto {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly taskId: string | null,
    public readonly commentId: string | null,
    public readonly pageBlockId: string | null,
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

  static fromAggregate(attachment: AttachmentAggregate): AttachmentDto {
    return new AttachmentDto(
      attachment.getId(),
      attachment.getWorkspaceId(),
      attachment.getTaskId(),
      attachment.getCommentId(),
      attachment.getPageBlockId(),
      attachment.getUploadedBy(),
      attachment.getFileName(),
      attachment.getMimeType(),
      attachment.getSize(),
      attachment.getProvider(),
      attachment.getStorageKey(),
      attachment.getPublicId(),
      attachment.getUrl(),
      attachment.getSecureUrl(),
      attachment.getStatus(),
      attachment.getCreatedAt(),
      attachment.getUpdatedAt(),
    );
  }
}
