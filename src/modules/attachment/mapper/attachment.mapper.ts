import { Attachment } from '../domain/entities/attachment.entity';
import { AttachmentModel } from '../domain/models/attachment.model';
import { AttachmentResponseDto } from '../dto/response/attachment.response.dto';
import { SaveAttachmentInput } from '../interfaces/repositories/attachment.repository.interface';

export class AttachmentMapper {
  static toModel(entity: Attachment): AttachmentModel {
    return new AttachmentModel(
      entity.id,
      entity.workspaceId,
      entity.taskId ?? null,
      entity.commentId ?? null,
      entity.uploadedBy,
      entity.fileName,
      entity.mimeType,
      entity.size,
      entity.provider,
      entity.storageKey ?? null,
      entity.publicId ?? null,
      entity.url ?? null,
      entity.secureUrl ?? null,
      entity.status,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(model: AttachmentModel | SaveAttachmentInput): Attachment {
    const e = new Attachment();

    if (model.id != null) e.id = model.id;

    e.workspaceId = model.workspaceId;
    e.taskId = model.taskId ?? null;
    e.commentId = model.commentId ?? null;
    e.uploadedBy = model.uploadedBy;
    e.fileName = model.fileName;
    e.mimeType = model.mimeType;
    e.size = model.size;
    e.provider = model.provider;
    e.storageKey = model.storageKey ?? null;
    e.publicId = model.publicId ?? null;
    e.url = model.url ?? null;
    e.secureUrl = model.secureUrl ?? null;
    e.status = model.status;

    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    return e;
  }

  static toResponse(model: AttachmentModel): AttachmentResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      taskId: model.taskId,
      commentId: model.commentId,
      uploadedBy: model.uploadedBy,
      fileName: model.fileName,
      mimeType: model.mimeType,
      size: model.size,
      provider: model.provider,
      storageKey: model.storageKey,
      publicId: model.publicId,
      url: model.url,
      secureUrl: model.secureUrl,
      status: model.status,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
