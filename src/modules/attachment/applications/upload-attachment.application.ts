import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { UploadAttachmentApplication } from '../interfaces/applications/upload-attachment.application.interface';
import type { UploadAttachmentService } from '../interfaces/services/upload-attachment.service.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { AttachmentResponseDto } from '../dto/response/attachment.response.dto';
import { UploadAttachmentDto } from '../dto/create-attachment.dto';
import { AttachmentMapper } from '../mapper/attachment.mapper';
import { ACTIVITY_TYPES } from '../../activity/interfaces/types';
import type { CreateActivityService } from '../../activity/interfaces/services/create-activity.service.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from '../../activity/domain/entities/activity.entity';

@Injectable()
export class UploadAttachmentApplicationImpl
  implements UploadAttachmentApplication
{
  constructor(
    @Inject(ATTACHMENT_TYPES.services.UploadAttachmentService)
    private readonly uploadService: UploadAttachmentService,
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async execute(
    file: Express.Multer.File,
    body: UploadAttachmentDto,
    userId: string,
  ): Promise<AttachmentResponseDto> {
    if (!body.taskId && !body.commentId) {
      throw new BadRequestException('taskId or commentId is required');
    }

    /**
     * TODO:
     * Check quyền ở đây:
     * - user có thuộc workspace không
     * - user có quyền xem task/comment không
     */

    const saved = await this.uploadService.execute(
      file,
      body.workspaceId,
      body.taskId ?? null,
      body.commentId ?? null,
      userId,
    );

    await this.createActivityService.create({
      workspaceId: saved.workspaceId,
      entityType: ActivityEntityType.ATTACHMENT,
      entityId: saved.id,
      actorId: userId,
      action: ActivityAction.ATTACHMENT_UPLOADED,
      metadata: {
        taskId: saved.taskId,
        commentId: saved.commentId,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        size: saved.size,
      },
    });

    return AttachmentMapper.toResponse(saved);
  }
}
