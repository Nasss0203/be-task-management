import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SprintStatus } from 'src/modules/sprints/domain/entities/sprint.entity';
import { type FindSprintService } from 'src/modules/sprints/interfaces/services/find-sprint.service.interface';
import { SPRINT_TYPES } from 'src/modules/sprints/interfaces/types';
import { type FindMemberService } from 'src/modules/user_workspace/interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import {
  MoveTaskSprintApplication,
  MoveTaskSprintApplicationInput,
} from '../interfaces/applications/move-task-sprint.application.interface';
import { type FindTaskService } from '../interfaces/services/find-task.service.interface';
import { type MoveTaskSprintService } from '../interfaces/services/move-task-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class MoveTaskSprintApplicationImpl implements MoveTaskSprintApplication {
  constructor(
    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,

    @Inject(SPRINT_TYPES.services.FindSprintService)
    private readonly findSprintService: FindSprintService,

    @Inject(USER_WORKSPACE_TYPES.services.FindMemberService)
    private readonly findMemberService: FindMemberService,

    @Inject(TASK_TYPES.services.MoveTaskSprintService)
    private readonly moveTaskSprintService: MoveTaskSprintService,
  ) {}

  async move(input: MoveTaskSprintApplicationInput): Promise<TaskResponseDto> {
    const task = await this.findTaskService.findOneTask(input.taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const actorMember = await this.findMemberService.findMemberInWorkspace(
      task.workspaceId,
      input.userId,
    );

    if (!actorMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (input.sprintId) {
      const sprint = await this.findSprintService.findOneSprint(input.sprintId);

      if (!sprint) {
        throw new NotFoundException('Sprint not found');
      }

      if (sprint.workspaceId !== task.workspaceId) {
        throw new BadRequestException(
          'Sprint and task must be in the same workspace',
        );
      }

      if (sprint.projectId !== task.projectId) {
        throw new BadRequestException(
          'Sprint and task must be in the same project',
        );
      }

      if (
        sprint.status === SprintStatus.COMPLETED ||
        sprint.status === SprintStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cannot move task to completed or cancelled sprint',
        );
      }
    }

    const movedTask = await this.moveTaskSprintService.move({
      sprintId: input.sprintId,
      taskId: input.taskId,
    });

    return TaskMapper.toResponse(movedTask);
  }
}
