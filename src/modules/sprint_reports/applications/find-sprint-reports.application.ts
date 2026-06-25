import { Inject, Injectable } from '@nestjs/common';
import type { FindSprintReportsApplication } from '../interfaces/applications/find-sprint-reports.application.interface';
import type { FindSprintReportsService } from '../interfaces/services/find-sprint-reports.service.interface';
import { SPRINT_REPORT_TYPES } from '../interfaces/types';
import { SprintReportResponseDto } from '../dto/response/sprint-report.response.dto';
import { SprintReportsMapper } from '../mapper/sprint-reports.mapper';

@Injectable()
export class FindSprintReportsApplicationImpl
  implements FindSprintReportsApplication
{
  constructor(
    @Inject(SPRINT_REPORT_TYPES.services.FindSprintReportsService)
    private readonly findSprintReportsService: FindSprintReportsService,
  ) {}

  async execute(
    workspaceId: string,
    projectId: string,
  ): Promise<SprintReportResponseDto[]> {
    const models = await this.findSprintReportsService.findReports(
      workspaceId,
      projectId,
    );
    return models.map(SprintReportsMapper.toResponse);
  }
}
