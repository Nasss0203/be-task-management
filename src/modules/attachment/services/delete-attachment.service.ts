import { Inject, Injectable } from '@nestjs/common';
import type { DeleteAttachmentService } from '../interfaces/services/delete-attachment.service.interface';
import type { DeleteAttachmentRepository } from '../interfaces/repositories/delete-attachment.repository.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteAttachmentServiceImpl implements DeleteAttachmentService {
  constructor(
    @Inject(ATTACHMENT_TYPES.repositories.DeleteAttachmentRepository)
    private readonly repository: DeleteAttachmentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
