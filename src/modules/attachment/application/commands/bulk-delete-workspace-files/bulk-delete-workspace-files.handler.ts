import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import type { AttachmentStoragePort } from '../../ports/attachment-storage.port';
import { resolveStorageUploaderFilter } from '../../services/resolve-storage-uploader-filter';
import { BulkDeleteWorkspaceFilesCommand } from './bulk-delete-workspace-files.command';

@Injectable()
export class BulkDeleteWorkspaceFilesHandler {
  private readonly logger = new Logger(BulkDeleteWorkspaceFilesHandler.name);

  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,
    @Inject(ATTACHMENT_TOKENS.storage)
    private readonly storage: AttachmentStoragePort,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: BulkDeleteWorkspaceFilesCommand,
  ): Promise<{ deletedCount: number }> {
    const uploadedBy = await resolveStorageUploaderFilter(
      this.authorizationService,
      command.workspaceId,
      command.actorId,
    );
    const found = await this.attachmentRepository.findReadyByIds([
      ...new Set(command.attachmentIds),
    ]);
    const attachments = found.filter(
      (attachment) =>
        attachment.getWorkspaceId() === command.workspaceId &&
        (uploadedBy === null || attachment.getUploadedBy() === uploadedBy),
    );

    await this.attachmentRepository.deleteByIds(
      attachments.map((attachment) => attachment.getId()),
    );

    for (const attachment of attachments) {
      const key = attachment.getStorageKey();

      if (!key) {
        continue;
      }

      try {
        await this.storage.delete({ provider: attachment.getProvider(), key });
      } catch (error) {
        this.logger.warn(
          `Failed to delete stored file of attachment ${attachment.getId()}: ${String(error)}`,
        );
      }
    }

    return { deletedCount: attachments.length };
  }
}
