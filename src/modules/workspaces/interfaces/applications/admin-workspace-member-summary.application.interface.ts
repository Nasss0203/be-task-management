import { WorkspaceMemberSummaryResponseDto } from '../../dto/response/workspace-member-summary.response.dto';

export interface AdminWorkspaceMemberSummaryApplication {
  getMemberSummary(
    workspaceId: string,
  ): Promise<WorkspaceMemberSummaryResponseDto>;
}
