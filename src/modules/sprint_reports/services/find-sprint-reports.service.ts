import { Inject, Injectable } from '@nestjs/common';
import type { FindSprintReportsRepository } from '../interfaces/repositories/find-sprint-reports.repository.interface';
import type { FindSprintReportsService } from '../interfaces/services/find-sprint-reports.service.interface';
import { SPRINT_REPORT_TYPES } from '../interfaces/types';
import { SprintReportsModel } from '../domain/models/sprint-reports.model';
import { SprintReportsMapper } from '../mapper/sprint-reports.mapper';

@Injectable()
export class FindSprintReportsServiceImpl implements FindSprintReportsService {
  constructor(
    @Inject(SPRINT_REPORT_TYPES.repositories.FindSprintReportsRepository)
    private readonly findSprintReportsRepository: FindSprintReportsRepository,
  ) {}

  async findReports(
    workspaceId: string,
    projectId: string,
  ): Promise<SprintReportsModel[]> {
    const reports =
      await this.findSprintReportsRepository.findReportsByProjectId(
        workspaceId,
        projectId,
      );
    return reports.map(SprintReportsMapper.toModel);
  }
}
