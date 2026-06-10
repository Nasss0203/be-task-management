import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateAttachmentDownloadUrlService } from '../interfaces/services/create-attachment-download-url.service.interface';
import type { FindAttachmentRepository } from '../interfaces/repositories/find-attachment.repository.interface';
import type { AttachmentStorageRouterService } from '../interfaces/services/attachment-storage-router.service.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { AttachmentProvider } from '../domain/entities/attachment.entity';

@Injectable()
export class CreateAttachmentDownloadUrlServiceImpl
  implements CreateAttachmentDownloadUrlService
{
  constructor(
    @Inject(ATTACHMENT_TYPES.repositories.FindAttachmentRepository)
    private readonly findRepository: FindAttachmentRepository,
    @Inject(ATTACHMENT_TYPES.services.AttachmentStorageRouterService)
    private readonly storageRouter: AttachmentStorageRouterService,
  ) {}

  async execute(attachmentId: string): Promise<{
    attachmentId: string;
    fileName: string;
    mimeType: string;
    size: number;
    downloadUrl: string;
    expiresIn: number;
  }> {
    const attachment = await this.findRepository.findReadyById(attachmentId);

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.provider === AttachmentProvider.CLOUDINARY) {
      if (!attachment.secureUrl) {
        throw new NotFoundException('Cloudinary URL not found');
      }

      return {
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        downloadUrl: attachment.secureUrl,
        expiresIn: 31536000, // Cloudinary URLs without signature don't expire normally
      };
    }

    if (!attachment.storageKey) {
      throw new NotFoundException('Attachment storage key not found');
    }

    const result = await this.storageRouter.createDownloadUrl({
      key: attachment.storageKey,
      fileName: attachment.fileName,
    });

    return {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      downloadUrl: result.downloadUrl,
      expiresIn: result.expiresIn,
    };
  }
}
