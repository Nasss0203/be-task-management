import { SprintReportResponseDto } from '../../dto/response/sprint-report.response.dto';

export interface FindSprintReportsApplication {
  execute(
    workspaceId: string,
    projectId: string,
  ): Promise<SprintReportResponseDto[]>;
}
