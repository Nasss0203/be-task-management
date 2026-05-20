import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceMemberSummaryResponseDto } from '../dto/response/workspace-member-summary.response.dto';
import { AdminWorkspaceMemberSummaryApplication } from '../interfaces/applications/admin-workspace-member-summary.application.interface';
import { type AdminWorkspaceMemberSummaryService } from '../interfaces/services/admin-workspace-member-summary.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class AdminWorkspaceMemberSummaryApplicationImpl implements AdminWorkspaceMemberSummaryApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.AdminWorkspaceMemberSummaryService)
    private readonly service: AdminWorkspaceMemberSummaryService,
  ) {}

  async getMemberSummary(
    workspaceId: string,
  ): Promise<WorkspaceMemberSummaryResponseDto> {
    const summary = await this.service.getMemberSummary(workspaceId);

    return {
      workspaceId: summary.workspaceId,
      owner: summary.owner
        ? {
            id: summary.owner.id,
            username: summary.owner.username,
            email: summary.owner.email,
          }
        : null,
      memberCount: summary.memberCount,
      inviteCount: summary.inviteCount,
    };
  }
}
