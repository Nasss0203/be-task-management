import { Injectable } from '@nestjs/common';
import { StorageService } from 'src/shared/infrastructure/storage/storage.service';
import type {
  AttachmentStorageUploadResult,
  UploadAttachmentStorageInput,
} from '../../application/ports/attachment-storage.port';
import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';

@Injectable()
export class R2AttachmentStorageAdapter {
  constructor(private readonly storageService: StorageService) {}

  async upload(
    input: UploadAttachmentStorageInput,
  ): Promise<AttachmentStorageUploadResult> {
    const storageKey = this.storageService.buildStorageKey({
      workspaceId: input.workspaceId,
      taskId: input.taskId ?? undefined,
      commentId: input.commentId ?? undefined,
      pageBlockId: input.pageBlockId ?? undefined,
      fileName: input.fileName,
    });

    await this.storageService.uploadBuffer({
      key: storageKey,
      buffer: input.buffer,
      contentType: input.mimeType,
      metadata: {
        uploadedBy: input.uploadedBy,
        originalName: encodeURIComponent(input.fileName),
      },
    });

    return {
      provider: AttachmentProvider.R2,
      storageKey,
      publicId: null,
      url: null,
      secureUrl: null,
    };
  }

  createDownloadUrl(input: {
    key: string;
    fileName: string;
  }): Promise<{ downloadUrl: string; expiresIn: number }> {
    return this.storageService.createDownloadUrl(input);
  }
}
