import { Inject, Injectable } from '@nestjs/common';
import type { CreateAttachmentDownloadUrlApplication } from '../interfaces/applications/create-attachment-download-url.application.interface';
import type { CreateAttachmentDownloadUrlService } from '../interfaces/services/create-attachment-download-url.service.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';

@Injectable()
export class CreateAttachmentDownloadUrlApplicationImpl
  implements CreateAttachmentDownloadUrlApplication
{
  constructor(
    @Inject(ATTACHMENT_TYPES.services.CreateAttachmentDownloadUrlService)
    private readonly downloadService: CreateAttachmentDownloadUrlService,
  ) {}

  async execute(
    attachmentId: string,
    userId: string,
  ): Promise<{
    attachmentId: string;
    fileName: string;
    mimeType: string;
    size: number;
    downloadUrl: string;
    expiresIn: number;
  }> {
    /**
     * TODO:
     * Check quyền download:
     * - user có thuộc workspace không
     * - user có quyền xem task/comment không
     */
    return this.downloadService.execute(attachmentId);
  }
}
