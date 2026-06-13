import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type MoveUnfinishedTasksToBacklogService } from 'src/modules/tasks/interfaces/services/move-unfinished-tasks-to-backlog.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { EntityManager } from 'typeorm';
import { SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { type CompleteSprintRepository } from '../interfaces/repositories/complete-sprint.repository.interface';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import {
  CompleteSprintService,
  CompleteSprintServiceInput,
} from '../interfaces/services/complete-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

// đổi path theo module task_status của bạn
import { type FindTaskStatusRepository } from 'src/modules/task_status/interfaces/repositories/find.task-status.repository.interface';
import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
import { type MarkDoneTasksCompletedAtInSprintService } from 'src/modules/tasks/interfaces/services/mark-done-tasks-completed-at-in-sprint.service.interface';
import { type CreateSprintReportRepository } from 'src/modules/sprint_reports/interfaces/repositories/create-sprint-report.repository.interface';
import { SPRINT_REPORT_TYPES } from 'src/modules/sprint_reports/interfaces/types';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { IsNull } from 'typeorm';

@Injectable()
export class CompleteSprintServiceImpl implements CompleteSprintService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.CompleteSprintRepository)
    private readonly completeSprintRepository: CompleteSprintRepository,

    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,

    @Inject(TASK_TYPES.services.MoveUnfinishedTasksToBacklogService)
    private readonly moveUnfinishedTasksToBacklogService: MoveUnfinishedTasksToBacklogService,

    @Inject(TASK_STATUS_TYPES.repositories.FindTaskStatusRepository)
    private readonly findTaskStatusRepository: FindTaskStatusRepository,

    @Inject(TASK_TYPES.services.MarkDoneTasksCompletedAtInSprintService)
    private readonly markDoneTasksCompletedAtInSprintService: MarkDoneTasksCompletedAtInSprintService,

    @Inject(SPRINT_REPORT_TYPES.repositories.CreateSprintReportRepository)
    private readonly createSprintReportRepository: CreateSprintReportRepository,
  ) { }

  async completeSprint(
    input: CompleteSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel> {
    const sprint = await this.findSprintRepository.findOneSprint(
      input.sprintId,
      manager,
    );

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (sprint.workspaceId !== input.workspaceId) {
      throw new BadRequestException('Sprint does not belong to this workspace');
    }

    if (sprint.projectId !== input.projectId) {
      throw new BadRequestException('Sprint does not belong to this project');
    }

    if (sprint.status !== SprintStatus.ACTIVE) {
      throw new BadRequestException('Only active sprint can be completed');
    }

    const doneStatus = await this.findTaskStatusRepository.findDoneStatus(
      input.projectId,
      input.workspaceId,
      manager,
    );

    if (!doneStatus) {
      throw new BadRequestException('Done status not found');
    }

    const now = new Date();

    await this.markDoneTasksCompletedAtInSprintService.mark(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        sprintId: input.sprintId,
        doneStatusId: doneStatus.id,
        completedAt: now,
      },
      manager,
    );

    // Calculate and save Sprint Report snapshot before moving tasks
    const taskRepo = manager ? manager.getRepository(Task) : this.completeSprintRepository['repo'].manager.getRepository(Task);
    const tasks = await taskRepo.find({
      where: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        sprintId: input.sprintId,
        deletedAt: IsNull(),
      },
      relations: ['assignees', 'assignees.user'],
    });

    const memberPerformanceMap = new Map<string, any>();
    const completedTaskDetails: any[] = [];
    const incompleteTaskDetails: any[] = [];

    const totalTasks = tasks.length;
    let completedTasks = 0;
    let totalEstimate = 0;
    let completedEstimate = 0;
    const completedTaskIds: string[] = [];
    const incompleteTaskIds: string[] = [];

    for (const t of tasks) {
      const isDone = t.statusId === doneStatus.id;
      const estimate = t.estimateMinutes || 0;
      totalEstimate += estimate;

      const assignees = t.assignees?.map(a => ({
        userId: a.userId,
        name: a.user?.name || a.user?.email,
        avatar: a.user?.avatar,
      })) || [];

      const taskDetail = {
        id: t.id,
        projectSeq: t.projectSeq,
        title: t.title,
        estimateMinutes: estimate,
        assignees,
      };

      if (isDone) {
        completedTasks++;
        completedEstimate += estimate;
        completedTaskIds.push(t.id);
        completedTaskDetails.push(taskDetail);
      } else {
        incompleteTaskIds.push(t.id);
        incompleteTaskDetails.push(taskDetail);
      }

      // Member Performance Tracking
      for (const a of assignees) {
        if (!memberPerformanceMap.has(a.userId)) {
          memberPerformanceMap.set(a.userId, {
            assigneeId: a.userId,
            assigneeName: a.name,
            avatar: a.avatar,
            completedTasks: 0,
            incompleteTasks: 0,
            completedEstimate: 0,
            incompleteEstimate: 0,
          });
        }
        const perf = memberPerformanceMap.get(a.userId);
        if (isDone) {
          perf.completedTasks++;
          perf.completedEstimate += estimate;
        } else {
          perf.incompleteTasks++;
          perf.incompleteEstimate += estimate;
        }
      }
    }

    const incompleteTasks = totalTasks - completedTasks;
    const memberPerformance = Array.from(memberPerformanceMap.values());

    await this.createSprintReportRepository.create(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        sprintId: sprint.id,
        sprintName: sprint.name,
        sprintGoal: sprint.goal,
        totalTasks,
        completedTasks,
        incompleteTasks,
        totalEstimate,
        completedEstimate,
        completedTaskIds,
        incompleteTaskIds,
        memberPerformance,
        completedTaskDetails,
        incompleteTaskDetails,
        startAt: sprint.startAt,
        completedAt: now,
      },
      manager,
    );

    await this.moveUnfinishedTasksToBacklogService.move(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        sprintId: input.sprintId,
        doneStatusId: doneStatus.id,
      },
      manager,
    );

    const completedSprint = await this.completeSprintRepository.completeSprint(
      input.sprintId,
      manager,
    );

    if (!completedSprint) {
      throw new NotFoundException('Sprint not found');
    }

    return completedSprint;
  }
}
