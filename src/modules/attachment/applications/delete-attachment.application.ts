import { Inject, Injectable } from '@nestjs/common';
import type { DeleteAttachmentApplication } from '../interfaces/applications/delete-attachment.application.interface';
import type { DeleteAttachmentService } from '../interfaces/services/delete-attachment.service.interface';
import { ATTACHMENT_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteAttachmentApplicationImpl
  implements DeleteAttachmentApplication
{
  constructor(
    @Inject(ATTACHMENT_TYPES.services.DeleteAttachmentService)
    private readonly deleteService: DeleteAttachmentService,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    await this.deleteService.execute(id);
  }
}
