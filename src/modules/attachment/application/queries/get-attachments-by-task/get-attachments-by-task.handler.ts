import { Inject, Injectable } from '@nestjs/common';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import { AttachmentDto } from '../../dto/attachment.dto';
import { GetAttachmentsByTaskQuery } from './get-attachments-by-task.query';

@Injectable()
export class GetAttachmentsByTaskHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,
  ) {}

  async execute(query: GetAttachmentsByTaskQuery): Promise<AttachmentDto[]> {
    const attachments = await this.attachmentRepository.findReadyByTaskId(
      query.taskId,
    );

    return attachments.map((attachment) =>
      AttachmentDto.fromAggregate(attachment),
    );
  }
}
