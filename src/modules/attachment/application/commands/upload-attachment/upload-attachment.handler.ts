import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import type { CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';

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
  ) {}

  async execute(command: UploadAttachmentCommand): Promise<AttachmentDto> {
    if (!command.taskId && !command.commentId && !command.pageBlockId) {
      throw new BadRequestException(
        'taskId, commentId or pageBlockId is required',
      );
    }

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
}
