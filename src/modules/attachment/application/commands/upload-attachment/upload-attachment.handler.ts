import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import type { CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import { AttachmentDto } from '../../dto/attachment.dto';
import type { AttachmentFileValidatorPort } from '../../ports/attachment-file-validator.port';
import type { AttachmentStoragePort } from '../../ports/attachment-storage.port';
import { UploadAttachmentCommand } from './upload-attachment.command';

@Injectable()
export class UploadAttachmentHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,

    @Inject(ATTACHMENT_TOKENS.fileValidator)
    private readonly fileValidator: AttachmentFileValidatorPort,

    @Inject(ATTACHMENT_TOKENS.storage)
    private readonly storage: AttachmentStoragePort,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepository: PageBlockRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: UploadAttachmentCommand): Promise<AttachmentDto> {
    if (!command.taskId && !command.commentId && !command.pageBlockId) {
      throw new BadRequestException(
        'taskId, commentId or pageBlockId is required',
      );
    }

    await this.assertCanAttachToPageBlock(command);

    // TODO(hardening): verify resource access and workspace consistency.

    const extension = this.fileValidator.validateExtension(
      command.file.originalName,
    );

    const mimeType = await this.fileValidator.validateRealFileType(
      command.file,
      extension,
    );

    const storageResult = await this.storage.upload({
      buffer: command.file.buffer,
      workspaceId: command.workspaceId,
      taskId: command.taskId,
      commentId: command.commentId,
      pageBlockId: command.pageBlockId,
      fileName: command.file.originalName,
      mimeType,
      uploadedBy: command.actorId,
    });

    const attachment = AttachmentAggregate.create({
      workspaceId: command.workspaceId,
      taskId: command.taskId,
      commentId: command.commentId,
      pageBlockId: command.pageBlockId,
      uploadedBy: command.actorId,
      fileName: command.file.originalName,
      mimeType,
      size: command.file.size,
      provider: storageResult.provider,
      storageKey: storageResult.storageKey,
      publicId: storageResult.publicId,
      url: storageResult.url,
      secureUrl: storageResult.secureUrl,
    });

    const saved = await this.attachmentRepository.save(attachment);

    await this.createActivityService.create({
      workspaceId: saved.getWorkspaceId(),
      entityType: ActivityEntityType.ATTACHMENT,
      entityId: saved.getId(),
      actorId: command.actorId,
      action: ActivityAction.ATTACHMENT_UPLOADED,
      metadata: {
        taskId: saved.getTaskId(),
        commentId: saved.getCommentId(),
        pageBlockId: saved.getPageBlockId(),
        fileName: saved.getFileName(),
        mimeType: saved.getMimeType(),
        size: saved.getSize(),
      },
    });

    return AttachmentDto.fromAggregate(saved);
  }

  private async assertCanAttachToPageBlock(
    command: UploadAttachmentCommand,
  ): Promise<void> {
    if (!command.pageBlockId) {
      return;
    }

    const block = await this.pageBlockRepository.findById(command.pageBlockId);
    const page =
      block && !block.getDeletedAt()
        ? await this.pageRepository.findById(block.getPageId())
        : null;

    const allowed =
      page?.getWorkspaceId() === command.workspaceId &&
      (await this.authorizationService.authorize({
        userId: command.actorId,
        permissions: [PERMISSIONS.PAGE_BLOCK_UPDATE],
        target: { type: 'pageBlock', id: command.pageBlockId },
      }));

    if (!allowed) {
      throw new NotFoundException('Page block not found');
    }
  }
}
