import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type FindTaskService } from 'src/modules/tasks/interfaces/services/find-task.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { type FindMemberService } from 'src/modules/user_workspace/interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { TaskCommentModel } from '../domain/models/task_comment.model';

import { EntityManager } from 'typeorm';
import { type CreateTaskCommentRepository } from '../interfaces/repositories/create.task_commnent.repository.interface';
import {
  CreateTaskCommentInput,
  CreateTaskCommentService,
} from '../interfaces/services/create.task_commnent.service.interface';
import { TASK_COMMENT_TYPES } from '../interfaces/types';

@Injectable()
export class CreateTaskCommentServiceImpl implements CreateTaskCommentService {
  constructor(
    @Inject(TASK_COMMENT_TYPES.repositories.CreateTaskCommentRepository)
    private readonly repo: CreateTaskCommentRepository,

    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,

    @Inject(USER_WORKSPACE_TYPES.services.FindMemberService)
    private readonly findMemberService: FindMemberService,
  ) {}

  async create(
    input: CreateTaskCommentInput,
    manager?: EntityManager,
  ): Promise<TaskCommentModel> {
    const task = await this.findTaskService.findOneTask(input.taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (
      task.workspaceId !== input.workspaceId ||
      task.projectId !== input.projectId
    ) {
      throw new ForbiddenException('Task does not belong to this project');
    }

    const member = await this.findMemberService.findMemberInWorkspace(
      input.workspaceId,
      input.authorId,
    );

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.repo.create(
      {
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        authorId: input.authorId,
        content: input.content.trim(),
        isEdited: false,
      },
      manager,
    );
  }
}
