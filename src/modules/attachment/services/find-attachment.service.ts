import { Inject, Injectable } from '@nestjs/common';
import { AttachmentModel } from '../domain/models/attachment.model';
import type { FindAttachmentService } from '../interfaces/services/find-attachment.service.interface';
import type { FindAttachmentRepository } from '../interfaces/repositories/find-attachment.repository.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';

@Injectable()
export class FindAttachmentServiceImpl implements FindAttachmentService {
  constructor(
    @Inject(ATTACHMENT_TYPES.repositories.FindAttachmentRepository)
    private readonly repository: FindAttachmentRepository,
  ) {}

  async findReadyById(id: string): Promise<AttachmentModel | null> {
    return this.repository.findReadyById(id);
  }

  async findByTask(taskId: string): Promise<AttachmentModel[]> {
    return this.repository.findByTask(taskId);
  }
}
