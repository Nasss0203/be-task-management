import { Inject, Injectable } from '@nestjs/common';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import { DeleteAttachmentCommand } from './delete-attachment.command';

@Injectable()
export class DeleteAttachmentHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,
  ) {}

  async execute(command: DeleteAttachmentCommand): Promise<void> {
    await this.attachmentRepository.delete(command.attachmentId);
  }
}
