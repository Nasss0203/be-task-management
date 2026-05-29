import { Controller, Get, Inject, Param } from '@nestjs/common';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type FindTaskStatusService } from '../interfaces/services/find.task-status.service.interface';
import { TASK_STATUS_TYPES } from '../interfaces/types';
import { TaskStatusService } from '../task_status.service';

@Controller('task-status')
export class TaskStatusController {
  constructor(
    private readonly taskStatusService: TaskStatusService,

    @Inject(TASK_STATUS_TYPES.services.FindTaskStatusService)
    private readonly findTaskStatusService: FindTaskStatusService,
  ) {}

  @Get('workspace/:workspaceId/project/:projectId')
  @RequirePermissions(PERMISSIONS.TASK_STATUS_READ)
  @ResponseMessage('Find all task status')
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.findTaskStatusService.findAllTaskStatus(projectId, workspaceId);
  }
}
