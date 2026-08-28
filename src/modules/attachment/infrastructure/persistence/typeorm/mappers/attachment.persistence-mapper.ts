import { AttachmentAggregate } from '../../../../domain/aggregates/attachment.aggregate';
import { AttachmentOrmEntity } from '../entities/attachment.orm-entity';

export class AttachmentPersistenceMapper {
  static toDomain(entity: AttachmentOrmEntity): AttachmentAggregate {
    return AttachmentAggregate.reconstitute({
      id: entity.id,
      workspaceId: entity.workspaceId,
      taskId: entity.taskId ?? null,
      commentId: entity.commentId ?? null,
      pageBlockId: entity.pageBlockId,
      uploadedBy: entity.uploadedBy,
      fileName: entity.fileName,
      mimeType: entity.mimeType,
      size: entity.size,
      provider: entity.provider,
      storageKey: entity.storageKey ?? null,
      publicId: entity.publicId ?? null,
      url: entity.url ?? null,
      secureUrl: entity.secureUrl ?? null,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(attachment: AttachmentAggregate): AttachmentOrmEntity {
    const entity = new AttachmentOrmEntity();

    entity.id = attachment.getId();
    entity.workspaceId = attachment.getWorkspaceId();
    entity.taskId = attachment.getTaskId();
    entity.commentId = attachment.getCommentId();
    entity.pageBlockId = attachment.getPageBlockId();
    entity.uploadedBy = attachment.getUploadedBy();
    entity.fileName = attachment.getFileName();
    entity.mimeType = attachment.getMimeType();
    entity.size = attachment.getSize();
    entity.provider = attachment.getProvider();
    entity.storageKey = attachment.getStorageKey();
    entity.publicId = attachment.getPublicId();
    entity.url = attachment.getUrl();
    entity.secureUrl = attachment.getSecureUrl();
    entity.status = attachment.getStatus();
    entity.createdAt = attachment.getCreatedAt();
    entity.updatedAt = attachment.getUpdatedAt();

    return entity;
  }
}
