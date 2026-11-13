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
import { COMMENT_TYPES } from 'src/modules/comments/comments.types';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { BILLING_TYPES } from 'src/modules/billing/billing.types';
import type { WorkspaceEntitlementPort } from 'src/modules/billing/application/ports/workspace-entitlement.port';
import { BillingFeatureCode } from 'src/modules/billing/domain/constants/billing-feature-code.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import { AttachmentDto } from '../../dto/attachment.dto';
import type { AttachmentFileValidatorPort } from '../../ports/attachment-file-validator.port';
import type {
  AttachmentStoragePort,
  AttachmentStorageUploadResult,
} from '../../ports/attachment-storage.port';
import { UploadAttachmentCommand } from './upload-attachment.command';

const BYTES_PER_MB = 1024 * 1024;

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

    @Inject(COMMENT_TYPES.repositories.CommentRepository)
    private readonly commentRepository: CommentRepository,

    private readonly authorizationService: AuthorizationService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(BILLING_TYPES.services.WorkspaceEntitlementPort)
    private readonly entitlements: WorkspaceEntitlementPort,
  ) {}

  async execute(command: UploadAttachmentCommand): Promise<AttachmentDto> {
    if (!command.commentId && !command.pageBlockId) {
      throw new BadRequestException('commentId or pageBlockId is required');
    }

    await this.assertCanAttachToPageBlock(command);
    await this.assertCommentInWorkspace(command);

    const extension = this.fileValidator.validateExtension(
      command.file.originalName,
    );

    const mimeType = await this.fileValidator.validateRealFileType(
      command.file,
      extension,
    );

    const sizeMb = command.file.size / BYTES_PER_MB;
    await this.entitlements.assertWithinLimit(
      command.workspaceId,
      BillingFeatureCode.MAX_STORAGE_MB,
      sizeMb,
    );

    const storageResult = await this.storage.upload({
      buffer: command.file.buffer,
      workspaceId: command.workspaceId,
      commentId: command.commentId,
      pageBlockId: command.pageBlockId,
      fileName: command.file.originalName,
      mimeType,
      uploadedBy: command.actorId,
    });

    const attachment = AttachmentAggregate.create({
      workspaceId: command.workspaceId,
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

    const saved = await this.saveWithinStorageLimit(
      attachment,
      sizeMb,
      storageResult,
    );

    await this.createActivityService.create({
      workspaceId: saved.getWorkspaceId(),
      entityType: ActivityEntityType.ATTACHMENT,
      entityId: saved.getId(),
      actorId: command.actorId,
      action: ActivityAction.ATTACHMENT_UPLOADED,
      metadata: {
        commentId: saved.getCommentId(),
        pageBlockId: saved.getPageBlockId(),
        fileName: saved.getFileName(),
        mimeType: saved.getMimeType(),
        size: saved.getSize(),
      },
    });

    return AttachmentDto.fromAggregate(saved);
  }

  private async saveWithinStorageLimit(
    attachment: AttachmentAggregate,
    sizeMb: number,
    storageResult: AttachmentStorageUploadResult,
  ): Promise<AttachmentAggregate> {
    try {
      return await this.unitOfWork.runInTransaction(async (context) => {
        await this.entitlements.assertWithinLimit(
          attachment.getWorkspaceId(),
          BillingFeatureCode.MAX_STORAGE_MB,
          sizeMb,
          context,
        );
        return this.attachmentRepository.save(attachment, context);
      });
    } catch (error) {
      if (storageResult.storageKey) {
        await this.storage
          .delete({
            provider: storageResult.provider,
            key: storageResult.storageKey,
          })
          .catch(() => undefined);
      }
      throw error;
    }
  }

  private async assertCommentInWorkspace(
    command: UploadAttachmentCommand,
  ): Promise<void> {
    if (!command.commentId) {
      return;
    }

    const comment = await this.commentRepository.findById(command.commentId);

    if (
      !comment ||
      comment.isDeleted() ||
      comment.getWorkspaceId() !== command.workspaceId
    ) {
      throw new NotFoundException('Comment not found');
    }
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
