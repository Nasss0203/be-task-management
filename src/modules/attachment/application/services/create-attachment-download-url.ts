import { NotFoundException } from '@nestjs/common';
import type { AttachmentAggregate } from '../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';
import { AttachmentDownloadUrlDto } from '../dto/attachment-download-url.dto';
import type { AttachmentStoragePort } from '../ports/attachment-storage.port';

export async function createAttachmentDownloadUrl(
  attachment: AttachmentAggregate,
  storage: AttachmentStoragePort,
): Promise<AttachmentDownloadUrlDto> {
  if (attachment.getProvider() === AttachmentProvider.CLOUDINARY) {
    const secureUrl = attachment.getSecureUrl();

    if (!secureUrl) {
      throw new NotFoundException('Cloudinary URL not found');
    }

    return new AttachmentDownloadUrlDto(
      attachment.getId(),
      attachment.getFileName(),
      attachment.getMimeType(),
      attachment.getSize(),
      secureUrl,
      31536000,
    );
  }

  const storageKey = attachment.getStorageKey();

  if (!storageKey) {
    throw new NotFoundException('Attachment storage key not found');
  }

  const result = await storage.createDownloadUrl({
    provider: attachment.getProvider(),
    key: storageKey,
    fileName: attachment.getFileName(),
    contentType: attachment.getMimeType(),
  });

  return new AttachmentDownloadUrlDto(
    attachment.getId(),
    attachment.getFileName(),
    attachment.getMimeType(),
    attachment.getSize(),
    result.downloadUrl,
    result.expiresIn,
  );
}
