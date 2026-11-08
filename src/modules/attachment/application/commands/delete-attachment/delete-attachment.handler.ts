import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import type { AttachmentStoragePort } from '../../ports/attachment-storage.port';
import { DeleteAttachmentCommand } from './delete-attachment.command';

@Injectable()
export class DeleteAttachmentHandler {
  private readonly logger = new Logger(DeleteAttachmentHandler.name);

  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepository: PageBlockRepository,
    private readonly authorizationService: AuthorizationService,
    @Inject(ATTACHMENT_TOKENS.storage)
    private readonly storage: AttachmentStoragePort,
  ) {}

  async execute(command: DeleteAttachmentCommand): Promise<void> {
    const attachment = await this.attachmentRepository.findReadyById(
      command.attachmentId,
    );

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const pageBlockId = attachment.getPageBlockId();
    const block = pageBlockId
      ? await this.pageBlockRepository.findById(pageBlockId)
      : null;

    if (block && !block.getDeletedAt()) {
      const allowed = await this.authorizationService.authorize({
        userId: command.actorId,
        permissions: [PERMISSIONS.PAGE_BLOCK_UPDATE],
        target: { type: 'pageBlock', id: block.getId() },
      });

      if (!allowed) {
        throw new NotFoundException('Attachment not found');
      }
    }

    await this.attachmentRepository.delete(command.attachmentId);

    const storageKey = attachment.getStorageKey();

    if (!storageKey) {
      return;
    }

    try {
      await this.storage.delete({
        provider: attachment.getProvider(),
        key: storageKey,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to delete stored file of attachment ${command.attachmentId}: ${String(error)}`,
      );
    }
  }
}
