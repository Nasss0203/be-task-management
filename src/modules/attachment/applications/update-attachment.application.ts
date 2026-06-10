import { Inject, Injectable } from '@nestjs/common';
import type { UpdateAttachmentApplication } from '../interfaces/applications/update-attachment.application.interface';
import type { UpdateAttachmentService } from '../interfaces/services/update-attachment.service.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { AttachmentResponseDto } from '../dto/response/attachment.response.dto';
import { UpdateAttachmentDto } from '../dto/update-attachment.dto';
import { AttachmentMapper } from '../mapper/attachment.mapper';

@Injectable()
export class UpdateAttachmentApplicationImpl
  implements UpdateAttachmentApplication
{
  constructor(
    @Inject(ATTACHMENT_TYPES.services.UpdateAttachmentService)
    private readonly updateService: UpdateAttachmentService,
  ) {}

  async execute(
    id: string,
    data: UpdateAttachmentDto,
    userId: string,
  ): Promise<AttachmentResponseDto> {
    const updated = await this.updateService.execute(id, data);
    return AttachmentMapper.toResponse(updated);
  }
}
