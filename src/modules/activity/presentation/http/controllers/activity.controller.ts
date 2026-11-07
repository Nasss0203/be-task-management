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
import { Auth } from 'src/common/decorator/auth.decorator';
import type { IAuth } from 'src/types/auth';
import { GetPageActivitiesHandler } from '../../../application/queries/get-page-activities/get-page-activities.handler';
import { GetPageActivitiesQuery } from '../../../application/queries/get-page-activities/get-page-activities.query';
import { GetPageActivitySummaryHandler } from '../../../application/queries/get-page-activity-summary/get-page-activity-summary.handler';
import { GetPageActivitySummaryQuery } from '../../../application/queries/get-page-activity-summary/get-page-activity-summary.query';

@Controller('activity')
@ReadRateLimit()
export class ActivityController {
  constructor(
    private readonly getActivitiesHandler: GetActivitiesHandler,
    private readonly getPageActivitiesHandler: GetPageActivitiesHandler,
    private readonly getPageActivitySummaryHandler: GetPageActivitySummaryHandler,
  ) {}

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

  @Get('workspaces/:workspaceId/pages/:pageId/summary')
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_READ)
  @ResponseMessage('Find page activity summary successfully')
  findPageSummary(
    @Param('workspaceId') workspaceId: string,
    @Param('pageId') pageId: string,
    @Auth() auth: IAuth,
  ) {
    return this.getPageActivitySummaryHandler.execute(
      new GetPageActivitySummaryQuery(auth.id, workspaceId, pageId),
    );
  }

  @Get('workspaces/:workspaceId/pages/:pageId')
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_READ)
  @ResponseMessage('Find page activities successfully')
  findByPage(
    @Param('workspaceId') workspaceId: string,
    @Param('pageId') pageId: string,
    @Query() query: FindActivityQueryDto,
    @Auth() auth: IAuth,
  ) {
    return this.getPageActivitiesHandler.execute(
      new GetPageActivitiesQuery(
        auth.id,
        workspaceId,
        pageId,
        query.cursor,
        query.limit,
      ),
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
