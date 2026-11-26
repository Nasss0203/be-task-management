import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import { AttachmentDownloadUrlDto } from '../../dto/attachment-download-url.dto';
import type { AttachmentStoragePort } from '../../ports/attachment-storage.port';
import { createAttachmentDownloadUrl } from '../../services/create-attachment-download-url';
import { CreateAttachmentDownloadUrlQuery } from './create-attachment-download-url.query';

@Injectable()
export class CreateAttachmentDownloadUrlHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,
    @Inject(ATTACHMENT_TOKENS.storage)
    private readonly storage: AttachmentStoragePort,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: CreateAttachmentDownloadUrlQuery,
  ): Promise<AttachmentDownloadUrlDto> {
    const attachment = await this.attachmentRepository.findReadyById(
      query.attachmentId,
    );

    if (!attachment || !(await this.canRead(query.actorId, attachment))) {
      throw new NotFoundException('Attachment not found');
    }

    return createAttachmentDownloadUrl(attachment, this.storage);
  }

  private async canRead(
    userId: string,
    attachment: AttachmentAggregate,
  ): Promise<boolean> {
    const pageBlockId = attachment.getPageBlockId();

    if (pageBlockId) {
      return this.authorizationService.authorize({
        userId,
        permissions: [PERMISSIONS.PAGE_BLOCK_READ],
        target: { type: 'pageBlock', id: pageBlockId },
      });
    }

    return this.authorizationService.authorize({
      userId,
      permissions: [PERMISSIONS.ATTACHMENT_READ],
      target: { type: 'workspace', id: attachment.getWorkspaceId() },
    });
  }
}
