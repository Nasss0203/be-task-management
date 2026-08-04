import { Inject, Injectable } from '@nestjs/common';
import type { FindAttachmentApplication } from '../interfaces/applications/find-attachment.application.interface';
import type { FindAttachmentService } from '../interfaces/services/find-attachment.service.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { AttachmentResponseDto } from '../dto/response/attachment.response.dto';
import { AttachmentMapper } from '../mapper/attachment.mapper';

@Injectable()
export class FindAttachmentApplicationImpl implements FindAttachmentApplication {
  constructor(
    @Inject(ATTACHMENT_TYPES.services.FindAttachmentService)
    private readonly findService: FindAttachmentService,
  ) {}

  async findByTask(taskId: string): Promise<AttachmentResponseDto[]> {
    const items = await this.findService.findByTask(taskId);
    return items.map(AttachmentMapper.toResponse);
  }
}
