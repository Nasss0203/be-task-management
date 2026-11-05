import { Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import { AttachmentDto } from '../../dto/attachment.dto';
import { GetAttachmentsByTaskQuery } from './get-attachments-by-task.query';

@Injectable()
export class GetAttachmentsByTaskHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: GetAttachmentsByTaskQuery): Promise<AttachmentDto[]> {
    const attachments = await this.attachmentRepository.findReadyByTaskId(
      query.taskId,
    );

    const workspaceIds = [
      ...new Set(attachments.map((a) => a.getWorkspaceId())),
    ];
    const readableWorkspaceIds = new Set<string>();

    for (const workspaceId of workspaceIds) {
      const allowed = await this.authorizationService.authorize({
        userId: query.actorId,
        permissions: [PERMISSIONS.ATTACHMENT_READ],
        target: { type: 'workspace', id: workspaceId },
      });

      if (allowed) {
        readableWorkspaceIds.add(workspaceId);
      }
    }

    return attachments
      .filter((attachment) =>
        readableWorkspaceIds.has(attachment.getWorkspaceId()),
      )
      .map((attachment) => AttachmentDto.fromAggregate(attachment));
  }
}
