import { Injectable } from '@nestjs/common';
import type {
  AttachmentStoragePort,
  AttachmentStorageUploadResult,
  UploadAttachmentStorageInput,
} from '../../application/ports/attachment-storage.port';
import { CloudinaryAttachmentStorageAdapter } from './cloudinary-attachment-storage.adapter';
import { R2AttachmentStorageAdapter } from './r2-attachment-storage.adapter';

@Injectable()
export class AttachmentStorageRouterAdapter implements AttachmentStoragePort {
  constructor(
    private readonly cloudinaryStorage: CloudinaryAttachmentStorageAdapter,
    private readonly r2Storage: R2AttachmentStorageAdapter,
  ) {}

  upload(
    input: UploadAttachmentStorageInput,
  ): Promise<AttachmentStorageUploadResult> {
    return input.mimeType.startsWith('image/')
      ? this.cloudinaryStorage.upload(input)
      : this.r2Storage.upload(input);
  }

  createDownloadUrl(input: {
    key: string;
    fileName: string;
  }): Promise<{ downloadUrl: string; expiresIn: number }> {
    return this.r2Storage.createDownloadUrl(input);
  }
}
