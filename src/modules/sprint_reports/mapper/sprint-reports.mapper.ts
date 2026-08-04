import { SprintReport } from '../domain/entities/sprint-report.entity';
import { SprintReportsModel } from '../domain/models/sprint-reports.model';
import { SprintReportResponseDto } from '../dto/response/sprint-report.response.dto';
import { CreateSprintReportData } from '../interfaces/repositories/create-sprint-report.repository.interface';

export class SprintReportsMapper {
  static toModel(entity: SprintReport): SprintReportsModel {
    return new SprintReportsModel(
      entity.id,
      entity.workspaceId,
      entity.projectId,
      entity.sprintId,
      entity.sprintName,
      entity.sprintGoal,
      entity.totalTasks,
      entity.completedTasks,
      entity.incompleteTasks,
      entity.totalEstimate,
      entity.completedEstimate,
      entity.completedTaskIds,
      entity.incompleteTaskIds,
      entity.memberPerformance,
      entity.completedTaskDetails,
      entity.incompleteTaskDetails,
      entity.startAt,
      entity.completedAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(data: CreateSprintReportData): SprintReport {
    const e = new SprintReport();
    e.workspaceId = data.workspaceId;
    e.projectId = data.projectId;
    e.sprintId = data.sprintId;
    e.sprintName = data.sprintName;
    e.sprintGoal = data.sprintGoal ?? null;
    e.totalTasks = data.totalTasks;
    e.completedTasks = data.completedTasks;
    e.incompleteTasks = data.incompleteTasks;
    e.totalEstimate = data.totalEstimate;
    e.completedEstimate = data.completedEstimate;
    e.completedTaskIds = data.completedTaskIds;
    e.incompleteTaskIds = data.incompleteTaskIds;
    e.memberPerformance = data.memberPerformance;
    e.completedTaskDetails = data.completedTaskDetails;
    e.incompleteTaskDetails = data.incompleteTaskDetails;

    if (data.startAt !== undefined) e.startAt = data.startAt ?? null;
    if (data.completedAt !== undefined)
      e.completedAt = data.completedAt ?? null;

    return e;
  }

  static toResponse(model: SprintReportsModel): SprintReportResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      sprintId: model.sprintId,
      sprintName: model.sprintName,
      sprintGoal: model.sprintGoal,
      totalTasks: model.totalTasks,
      completedTasks: model.completedTasks,
      incompleteTasks: model.incompleteTasks,
      totalEstimate: model.totalEstimate,
      completedEstimate: model.completedEstimate,
      completedTaskIds: model.completedTaskIds,
      incompleteTaskIds: model.incompleteTaskIds,
      memberPerformance: model.memberPerformance,
      completedTaskDetails: model.completedTaskDetails,
      incompleteTaskDetails: model.incompleteTaskDetails,
      startAt: model.startAt,
      completedAt: model.completedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
