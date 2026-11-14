import { Injectable } from '@nestjs/common';
import type {
  AttachmentStoragePort,
  AttachmentStorageUploadResult,
  UploadAttachmentStorageInput,
} from '../../application/ports/attachment-storage.port';
import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';
import { R2AttachmentStorageAdapter } from './r2-attachment-storage.adapter';
import { S3AttachmentStorageAdapter } from './s3-attachment-storage.adapter';

@Injectable()
export class AttachmentStorageRouterAdapter implements AttachmentStoragePort {
  constructor(
    private readonly s3Storage: S3AttachmentStorageAdapter,
    private readonly r2Storage: R2AttachmentStorageAdapter,
  ) {}

  upload(
    input: UploadAttachmentStorageInput,
  ): Promise<AttachmentStorageUploadResult> {
    return this.s3Storage.upload(input);
  }

  createDownloadUrl({
    provider,
    ...input
  }: {
    provider: AttachmentProvider;
    key: string;
    fileName: string;
    contentType?: string;
  }): Promise<{ downloadUrl: string; expiresIn: number }> {
    return provider === AttachmentProvider.S3
      ? this.s3Storage.createDownloadUrl(input)
      : this.r2Storage.createDownloadUrl(input);
  }

  async delete(input: {
    provider: AttachmentProvider;
    key: string;
  }): Promise<void> {
    if (input.provider === AttachmentProvider.S3) {
      await this.s3Storage.delete(input.key);
    }
  }
}
