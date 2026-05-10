import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { type FindTaskService } from 'src/modules/tasks/interfaces/services/find-task.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { type FindMemberService } from 'src/modules/user_workspace/interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { EntityManager } from 'typeorm';
import { TaskAssigneeResponseDto } from '../dto/response/task_assignee.response.dto';
import {
  CreateTaskAssigneeApplication,
  CreateTaskAssigneeApplicationInput,
} from '../interfaces/applications/create.task_assignee.application.interface';
import { type CreateTaskAssigneeService } from '../interfaces/services/create.task_assignee.service.interface';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';
import { TaskAssigneeMapper } from '../mapper/task_assignee.mapper';

@Injectable()
export class CreateTaskAssigneeApplicationImpl implements CreateTaskAssigneeApplication {
  constructor(
    @Inject(TASK_ASSIGNEE_TYPES.services.CreateTaskAssigneeService)
    private readonly createTaskAssigneeService: CreateTaskAssigneeService,

    @Inject(USER_WORKSPACE_TYPES.services.FindMemberService)
    private readonly findMemberService: FindMemberService,

    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,
  ) {}

  async assign(
    input: CreateTaskAssigneeApplicationInput,
    manager?: EntityManager,
  ): Promise<TaskAssigneeResponseDto> {
    const task = await this.findTaskService.findOneTask(input.taskId, manager);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const actorMember = await this.findMemberService.findMemberInWorkspace(
      task.workspaceId,
      input.assignedBy,
      manager,
    );

    if (!actorMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const targetMember = await this.findMemberService.findMemberInWorkspace(
      task.workspaceId,
      input.userId,
      manager,
    );

    if (!targetMember) {
      throw new BadRequestException(
        'Target user is not a member of this workspace',
      );
    }

    const isSelfAssign = input.userId === input.assignedBy;

    const canAssignOther = actorMember.role_name === RoleName.OWNER;

    if (!isSelfAssign && !canAssignOther) {
      throw new ForbiddenException(
        'You do not have permission to assign task to others',
      );
    }

    const result = await this.createTaskAssigneeService.assign(
      {
        taskId: input.taskId,
        userId: input.userId,
        assignedBy: input.assignedBy,
      },
      manager,
    );

    return TaskAssigneeMapper.toResponse(result);
  }
}
