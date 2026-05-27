import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { ActivityEntityType } from '../domain/entities/activity.entity';
import { FindActivityQueryDto } from '../dto/find-activity-query.dto';
import { type FindActivityApplication } from '../interfaces/applications/find-activity.application.interface';
import { ACTIVITY_TYPES } from '../interfaces/types';

@Controller('activity')
export class ActivityController {
  constructor(
    @Inject(ACTIVITY_TYPES.applications.FindActivityApplication)
    private readonly findActivityApplication: FindActivityApplication,
  ) {}

  @Get('workspaces/:workspaceId')
  @ResponseMessage('Find workspace activities successfully')
  findByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Query() query: FindActivityQueryDto,
  ) {
    return this.findActivityApplication.findByWorkspace(workspaceId, query);
  }

  @Get('workspaces/:workspaceId/projects/:projectId')
  @ResponseMessage('Find project activities successfully')
  findByProject(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Query() query: FindActivityQueryDto,
  ) {
    return this.findActivityApplication.findByProject(
      workspaceId,
      projectId,
      query,
    );
  }

  @Get('workspaces/:workspaceId/entities/:entityType/:entityId')
  @ResponseMessage('Find entity activities successfully')
  findByEntity(
    @Param('workspaceId') workspaceId: string,
    @Param('entityType') entityType: ActivityEntityType,
    @Param('entityId') entityId: string,
    @Query() query: FindActivityQueryDto,
  ) {
    return this.findActivityApplication.findByEntity(
      workspaceId,
      entityType,
      entityId,
      query,
    );
  }
}
