import { EntityManager } from 'typeorm';
import { SprintReport } from '../../domain/entities/sprint-report.entity';

export interface CreateSprintReportData {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  sprintName: string;
  sprintGoal?: string | null;
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  totalEstimate: number;
  completedEstimate: number;
  completedTaskIds: string[];
  incompleteTaskIds: string[];
  memberPerformance: Record<string, any>[];
  completedTaskDetails: Record<string, any>[];
  incompleteTaskDetails: Record<string, any>[];
  startAt?: Date | null;
  completedAt?: Date | null;
}

export interface CreateSprintReportRepository {
  create(
    data: CreateSprintReportData,
    manager?: EntityManager,
  ): Promise<SprintReport>;
}
