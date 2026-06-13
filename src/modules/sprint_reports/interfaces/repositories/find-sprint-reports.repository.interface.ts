import { EntityManager } from 'typeorm';
import { SprintReport } from '../../domain/entities/sprint-report.entity';

export interface FindSprintReportsRepository {
  findReportsByProjectId(
    workspaceId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<SprintReport[]>;

  findReportBySprintId(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintReport | null>;
}
