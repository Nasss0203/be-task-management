import { Controller, Get, Inject, Param } from '@nestjs/common';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TaskPriorityResponseDto } from '../dto/response/task_priority.response.dto';
import { type FindTaskPriorityApplication } from '../interfaces/applications/find.task-priority.application.interface';
import { TASK_PRIORITY_TYPES } from '../interfaces/types';

@Controller('task-priority')
export class TaskPriorityController {
  constructor(
    @Inject(TASK_PRIORITY_TYPES.applications.FindTaskPriorityApplication)
    private readonly findTaskPriorityApplication: FindTaskPriorityApplication,
  ) {}

  @Get('workspaces/:workspaceId/projects/:projectId')
  @RequirePermissions(PERMISSIONS.TASK_PRIORITY_READ)
  @ResponseMessage('Find all task priorities successfully')
  async findAllTaskPriority(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ): Promise<TaskPriorityResponseDto[]> {
    return await this.findTaskPriorityApplication.findAllTaskPriority(
      projectId,
      workspaceId,
    );
  }

  @Get('workspaces/:workspaceId/projects/:projectId/done')
  @RequirePermissions(PERMISSIONS.TASK_PRIORITY_READ)
  @ResponseMessage('Find done priority successfully')
  async findDonePriority(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ): Promise<TaskPriorityResponseDto | null> {
    return await this.findTaskPriorityApplication.findDonePriority(
      projectId,
      workspaceId,
    );
  }
}
