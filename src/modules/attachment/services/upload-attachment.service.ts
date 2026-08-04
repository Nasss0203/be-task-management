import { Inject, Injectable } from '@nestjs/common';
import { AttachmentModel } from '../domain/models/attachment.model';
import type { UploadAttachmentService } from '../interfaces/services/upload-attachment.service.interface';
import type { AttachmentFileValidatorService } from '../interfaces/services/attachment-file-validator.service.interface';
import type { AttachmentStorageRouterService } from '../interfaces/services/attachment-storage-router.service.interface';
import type { UploadAttachmentRepository } from '../interfaces/repositories/upload-attachment.repository.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import {
  AttachmentProvider,
  AttachmentStatus,
} from '../domain/entities/attachment.entity';

@Injectable()
export class UploadAttachmentServiceImpl implements UploadAttachmentService {
  constructor(
    @Inject(ATTACHMENT_TYPES.services.AttachmentFileValidatorService)
    private readonly fileValidator: AttachmentFileValidatorService,
    @Inject(ATTACHMENT_TYPES.services.AttachmentStorageRouterService)
    private readonly storageRouter: AttachmentStorageRouterService,
    @Inject(ATTACHMENT_TYPES.repositories.UploadAttachmentRepository)
    private readonly repository: UploadAttachmentRepository,
  ) {}

  async execute(
    file: Express.Multer.File,
    workspaceId: string,
    taskId: string | null,
    commentId: string | null,
    userId: string,
  ): Promise<AttachmentModel> {
    const ext = this.fileValidator.validateExtension(file.originalname);
    const mimeType = await this.fileValidator.validateRealFileType(file, ext);

    const isImage = mimeType.startsWith('image/');

    if (isImage) {
      const cloudinaryResult = await this.storageRouter.uploadToCloudinary({
        buffer: file.buffer,
        workspaceId,
        taskId,
        commentId,
        fileName: file.originalname,
      });

      return this.repository.save({
        workspaceId,
        taskId,
        commentId,
        uploadedBy: userId,
        fileName: file.originalname,
        mimeType,
        size: file.size,
        provider: AttachmentProvider.CLOUDINARY,
        publicId: cloudinaryResult.publicId,
        url: cloudinaryResult.url,
        secureUrl: cloudinaryResult.secureUrl,
        status: AttachmentStatus.READY,
      });
    }

    const storageKey = this.storageRouter.buildStorageKey({
      workspaceId,
      taskId,
      commentId,
      fileName: file.originalname,
    });

    await this.storageRouter.uploadBuffer({
      key: storageKey,
      buffer: file.buffer,
      contentType: mimeType,
      metadata: {
        uploadedBy: userId,
        originalName: encodeURIComponent(file.originalname),
      },
    });

    return this.repository.save({
      workspaceId,
      taskId,
      commentId,
      uploadedBy: userId,
      fileName: file.originalname,
      mimeType,
      size: file.size,
      provider: AttachmentProvider.R2,
      storageKey,
      status: AttachmentStatus.READY,
    });
  }
}
