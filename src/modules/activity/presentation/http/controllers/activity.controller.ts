import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { ActivityEntityType } from '../../../domain/entities/activity.entity';
import { FindActivityQueryDto } from '../../../application/dto/request/find-activity-query.dto';
import { GetActivitiesHandler } from '../../../application/queries/get-activities/get-activities.handler';
import { GetActivitiesQuery } from '../../../application/queries/get-activities/get-activities.query';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';

@Controller('activity')
@ReadRateLimit()
export class ActivityController {
  constructor(private readonly getActivitiesHandler: GetActivitiesHandler) {}

  @Get('workspaces/:workspaceId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.ACTIVITY_READ)
  @ResponseMessage('Find workspace activities successfully')
  findByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Query() query: FindActivityQueryDto,
  ) {
    return this.getActivitiesHandler.execute(
      new GetActivitiesQuery(workspaceId, query),
    );
  }

  @Get('workspaces/:workspaceId/projects/:projectId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.ACTIVITY_READ)
  @ResponseMessage('Find project activities successfully')
  findByProject(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Query() query: FindActivityQueryDto,
  ) {
    return this.getActivitiesHandler.execute(
      new GetActivitiesQuery(workspaceId, query, { projectId }),
    );
  }

  @Get('workspaces/:workspaceId/entities/:entityType/:entityId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.ACTIVITY_READ)
  @ResponseMessage('Find entity activities successfully')
  findByEntity(
    @Param('workspaceId') workspaceId: string,
    @Param('entityType') entityType: ActivityEntityType,
    @Param('entityId') entityId: string,
    @Query() query: FindActivityQueryDto,
  ) {
    return this.getActivitiesHandler.execute(
      new GetActivitiesQuery(workspaceId, query, { entityType, entityId }),
    );
  }
}
