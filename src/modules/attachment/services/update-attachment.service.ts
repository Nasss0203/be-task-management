import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AttachmentModel } from '../domain/models/attachment.model';
import type { UpdateAttachmentService } from '../interfaces/services/update-attachment.service.interface';
import type { UpdateAttachmentRepository } from '../interfaces/repositories/update-attachment.repository.interface';
import type { FindAttachmentRepository } from '../interfaces/repositories/find-attachment.repository.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateAttachmentServiceImpl implements UpdateAttachmentService {
  constructor(
    @Inject(ATTACHMENT_TYPES.repositories.FindAttachmentRepository)
    private readonly findRepository: FindAttachmentRepository,
    @Inject(ATTACHMENT_TYPES.repositories.UpdateAttachmentRepository)
    private readonly updateRepository: UpdateAttachmentRepository,
  ) {}

  async execute(
    id: string,
    data: Partial<AttachmentModel>,
  ): Promise<AttachmentModel> {
    const existing = await this.findRepository.findReadyById(id);
    if (!existing) {
      throw new NotFoundException('Attachment not found');
    }

    return this.updateRepository.update({
      ...existing,
      ...data,
      id,
    });
  }
}
