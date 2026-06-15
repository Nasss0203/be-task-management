import { EntityManager } from 'typeorm';
import { SprintReportsModel } from '../../domain/models/sprint-reports.model';

export interface FindSprintReportsService {
  findReports(
    workspaceId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<SprintReportsModel[]>;
}
