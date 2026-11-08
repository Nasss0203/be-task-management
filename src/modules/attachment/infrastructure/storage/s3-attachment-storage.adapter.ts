import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { StorageService } from 'src/shared/infrastructure/storage/storage.service';
import { STORAGE_TYPES } from 'src/shared/infrastructure/storage/storage.types';
import type {
  AttachmentStorageUploadResult,
  UploadAttachmentStorageInput,
} from '../../application/ports/attachment-storage.port';
import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';

const PUBLIC_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];
const DOWNLOAD_URL_TTL_SECONDS = 300;

@Injectable()
export class S3AttachmentStorageAdapter {
  private readonly publicBaseUrl: string;

  constructor(
    @Inject(STORAGE_TYPES.ObjectStorage)
    private readonly objectStorage: ObjectStoragePort,
    private readonly storageService: StorageService,
    configService: ConfigService,
  ) {
    this.publicBaseUrl = configService
      .getOrThrow<string>('AWS_S3_PUBLIC_BASE_URL')
      .replace(/\/+$/, '');
  }

  async upload(
    input: UploadAttachmentStorageInput,
  ): Promise<AttachmentStorageUploadResult> {
    const isPublic = PUBLIC_IMAGE_MIME_TYPES.includes(input.mimeType);
    const storageKey = `${isPublic ? 'public' : 'private'}/${this.storageService.buildStorageKey(
      {
        workspaceId: input.workspaceId,
        taskId: input.taskId ?? undefined,
        commentId: input.commentId ?? undefined,
        pageBlockId: input.pageBlockId ?? undefined,
        fileName: input.fileName,
      },
    )}`;

    await this.objectStorage.upload({
      key: storageKey,
      body: input.buffer,
      contentType: input.mimeType,
    });

    const publicUrl = isPublic ? `${this.publicBaseUrl}/${storageKey}` : null;

    return {
      provider: AttachmentProvider.S3,
      storageKey,
      publicId: null,
      url: publicUrl,
      secureUrl: publicUrl,
    };
  }

  async createDownloadUrl(input: {
    key: string;
    fileName: string;
    contentType?: string;
  }): Promise<{ downloadUrl: string; expiresIn: number }> {
    const downloadUrl = await this.objectStorage.getSignedDownloadUrl(
      input.key,
      DOWNLOAD_URL_TTL_SECONDS,
      { fileName: input.fileName, contentType: input.contentType },
    );

    return { downloadUrl, expiresIn: DOWNLOAD_URL_TTL_SECONDS };
  }

  delete(key: string): Promise<void> {
    return this.objectStorage.delete(key);
  }
}
