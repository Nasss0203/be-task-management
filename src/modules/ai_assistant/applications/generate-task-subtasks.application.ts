import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GenerateTaskSubtasksApplication } from '../interfaces/applications/generate-task-subtasks.application.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { type AiProviderService } from '../interfaces/services/ai-provider.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { type FindTaskService } from 'src/modules/tasks/interfaces/services/find-task.service.interface';
import { type CreateTaskService } from 'src/modules/tasks/interfaces/services/create-task.service.interface';
import { DataSource } from 'typeorm';

@Injectable()
export class GenerateTaskSubtasksApplicationImpl implements GenerateTaskSubtasksApplication {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.services.AiProviderService)
    private readonly aiProviderService: AiProviderService,

    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,

    @Inject(TASK_TYPES.services.CreateTaskService)
    private readonly createTaskService: CreateTaskService,

    private readonly dataSource: DataSource,
  ) {}

  async generate(input: {
    taskId: string;
    userId: string;
  }): Promise<any[]> {
    const task = await this.findTaskService.findOneTask(input.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const existingTitles = (task.subtasks || [])
      .map((sub) => sub.title?.toLowerCase().trim())
      .filter((title): title is string => Boolean(title));

    const subtaskTitles = await this.aiProviderService.generateSubtasks(
      task.title || '',
      task.description || '',
      existingTitles,
    );

    const createdSubtasks: any[] = [];

    if (subtaskTitles.length > 0) {
      await this.dataSource.transaction(async (manager) => {
        for (const title of subtaskTitles) {
          const trimmedTitle = title.trim();
          if (!trimmedTitle) {
            continue;
          }
          if (existingTitles.includes(trimmedTitle.toLowerCase())) {
            continue; // Skip exact duplicate
          }

          const subtask = await this.createTaskService.create(
            {
              workspaceId: task.workspaceId,
              projectId: task.projectId,
              parentTaskId: task.id,
              title: trimmedTitle,
              description: null,
              statusId: task.statusId,
              priorityId: task.priorityId || null,
              createdBy: input.userId,
              sprintId: task.sprintId || null,
            },
            manager,
          );
          createdSubtasks.push(subtask);
        }
      });
    }

    return createdSubtasks;
  }
}
