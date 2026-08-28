import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import { AttachmentDto } from '../../dto/attachment.dto';
import { UpdateAttachmentCommand } from './update-attachment.command';

@Injectable()
export class UpdateAttachmentHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,
  ) {}

  async execute(command: UpdateAttachmentCommand): Promise<AttachmentDto> {
    const attachment = await this.attachmentRepository.findReadyById(
      command.attachmentId,
    );

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    /**
     * Legacy update endpoint. The current HTTP request has no mutable fields.
     * Mutable fields require a separate product/API hardening decision.
     */
    const saved = await this.attachmentRepository.save(attachment);

    return AttachmentDto.fromAggregate(saved);
  }
}
