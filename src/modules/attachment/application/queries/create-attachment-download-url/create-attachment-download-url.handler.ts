import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import { AttachmentProvider } from '../../../domain/enums/attachment-provider.enum';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import { AttachmentDownloadUrlDto } from '../../dto/attachment-download-url.dto';
import type { AttachmentStoragePort } from '../../ports/attachment-storage.port';
import { CreateAttachmentDownloadUrlQuery } from './create-attachment-download-url.query';

@Injectable()
export class CreateAttachmentDownloadUrlHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,
    @Inject(ATTACHMENT_TOKENS.storage)
    private readonly storage: AttachmentStoragePort,
  ) {}

  async execute(
    query: CreateAttachmentDownloadUrlQuery,
  ): Promise<AttachmentDownloadUrlDto> {
    // TODO(hardening): authorize query.actorId against the attachment workspace.
    const attachment = await this.attachmentRepository.findReadyById(
      query.attachmentId,
    );

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

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

    const result = await this.storage.createDownloadUrl({
      key: storageKey,
      fileName: attachment.getFileName(),
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
}
