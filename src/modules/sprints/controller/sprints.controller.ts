import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  StrictWriteRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequireFeature } from 'src/common/decorator/require-features.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { FeatureKey } from 'src/modules/features/constants/feature-key.constant';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreateSprintDto } from '../dto/create-sprint.dto';
import { FindSprintQueryDto } from '../dto/find-sprint-query.dto';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import { SprintProgressResponseDto } from '../dto/sprint-progress.response.dto';
import { StartSprintDto } from '../dto/start-sprint.dto';
import { UpdateSprintDto } from '../dto/update-sprint.dto';
import { type CancelSprintApplication } from '../interfaces/applications/cancel-sprint.application.interface';
import { type CompleteSprintApplication } from '../interfaces/applications/complete-sprint.application.interface';
import { type CreateSprintApplication } from '../interfaces/applications/create-sprint.application.interface';
import { type FindSprintApplication } from '../interfaces/applications/find-sprint.application.interface';
import { type GetSprintDetailApplication } from '../interfaces/applications/get-sprint-detail.application.interface';
import { type StartSprintApplication } from '../interfaces/applications/start-sprint.application.interface';
import { type UpdateSprintApplication } from '../interfaces/applications/update-sprint.application.interface';
import { type DeleteSprintApplication } from '../interfaces/applications/delete-sprint.application.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Controller('sprints')
@ReadRateLimit()
export class SprintsController {
  constructor(
    @Inject(SPRINT_TYPES.applications.CreateSprintApplication)
    private readonly createSprintApplication: CreateSprintApplication,

    @Inject(SPRINT_TYPES.applications.FindSprintApplication)
    private readonly findSprintApplication: FindSprintApplication,

    @Inject(SPRINT_TYPES.applications.StartSprintApplication)
    private readonly startSprintApplication: StartSprintApplication,

    @Inject(SPRINT_TYPES.applications.CompleteSprintApplication)
    private readonly completeSprintApplication: CompleteSprintApplication,
    @Inject(SPRINT_TYPES.applications.CancelSprintApplication)
    private readonly cancelSprintApplication: CancelSprintApplication,

    @Inject(SPRINT_TYPES.applications.UpdateSprintApplication)
    private readonly updateSprintApplication: UpdateSprintApplication,

    @Inject(SPRINT_TYPES.applications.GetSprintDetailApplication)
    private readonly getSprintDetailApplication: GetSprintDetailApplication,

    @Inject(SPRINT_TYPES.applications.DeleteSprintApplication)
    private readonly deleteSprintApplication: DeleteSprintApplication,
  ) {}

  @Post('workspaces/:workspaceId/projects/:projectId')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.SPRINT_CREATE)
  @ResponseMessage('Create sprint successfully')
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
    @Auth() auth: IAuth,
  ) {
    return this.createSprintApplication.create({
      workspaceId,
      projectId,
      userId: auth.id,
      dto,
    });
  }

  @Get('workspaces/:workspaceId/projects/:projectId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.SPRINT_READ)
  @ResponseMessage('Find all sprint successfully')
  async findAllSprintByProject(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Query() query: FindSprintQueryDto,
    @Auth() auth: IAuth,
  ): Promise<SprintResponseDto[]> {
    return this.findSprintApplication.findAllSprintByProject({
      workspaceId,
      projectId,
      userId: auth.id,
      keyword: query.keyword,
      status: query.status,
      from: query.from,
      to: query.to,
    });
  }

  @Get('workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/tasks')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.SPRINT_READ, PERMISSIONS.TASK_READ)
  @ResponseMessage('Find tasks by sprint successfully')
  async findTasksBySprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Auth() auth: IAuth,
  ): Promise<SprintResponseDto> {
    return this.findSprintApplication.findTasksBySprint({
      workspaceId,
      projectId,
      sprintId,
      userId: auth.id,
    });
  }

  @Get('workspaces/:workspaceId/projects/:projectId/sprint/:sprintId/detail')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.SPRINT_READ)
  @ResponseMessage('Find sprint detail successfully')
  async getSprintDetail(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
  ): Promise<SprintResponseDto> {
    return await this.getSprintDetailApplication.getSprintDetail({
      workspaceId,
      projectId,
      sprintId,
    });
  }

  @Patch('workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/start')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.SPRINT_START)
  @ResponseMessage('Start sprint successfully')
  async startSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Body() dto: StartSprintDto,
    @Auth() auth: IAuth,
  ): Promise<SprintResponseDto> {
    return this.startSprintApplication.start({
      workspaceId,
      projectId,
      sprintId,
      userId: auth.id,
      dto,
    });
  }

  @Patch(
    'workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/complete',
  )
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.SPRINT_COMPLETE)
  @ResponseMessage('Complete sprint successfully')
  async completeSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Auth() auth: IAuth,
  ): Promise<SprintResponseDto> {
    return this.completeSprintApplication.complete({
      workspaceId,
      projectId,
      sprintId,
      userId: auth.id,
    });
  }

  @Patch('workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/cancel')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.SPRINT_CANCEL)
  async cancelSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Auth() auth: IAuth,
  ): Promise<SprintResponseDto> {
    return await this.cancelSprintApplication.cancelSprint({
      workspaceId,
      projectId,
      sprintId,
      userId: auth.id,
    });
  }

  @Delete('workspaces/:workspaceId/projects/:projectId/sprints/:sprintId')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.SPRINT_DELETE)
  @ResponseMessage('Delete sprint successfully')
  async deleteSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Auth() auth: IAuth,
  ): Promise<void> {
    return await this.deleteSprintApplication.delete({
      workspaceId,
      projectId,
      sprintId,
      userId: auth.id,
    });
  }

  @Patch('workspaces/:workspaceId/projects/:projectId/sprint/:sprintId')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.SPRINT_UPDATE)
  async updateSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Body() body: UpdateSprintDto,
    @Auth() auth: IAuth,
  ): Promise<SprintResponseDto> {
    return await this.updateSprintApplication.updateSprint({
      workspaceId,
      projectId,
      sprintId,
      userId: auth.id,
      name: body.name,
      goal: body.goal,
      startAt:
        body.startAt === undefined
          ? undefined
          : body.startAt === null
            ? null
            : new Date(body.startAt),
      endAt:
        body.endAt === undefined
          ? undefined
          : body.endAt === null
            ? null
            : new Date(body.endAt),
    });
  }

  @Get('workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/progress')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.SPRINT_READ)
  @ResponseMessage('Get sprint progress successfully')
  async getSprintProgress(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Auth() auth: IAuth,
  ): Promise<SprintProgressResponseDto> {
    return this.findSprintApplication.getSprintProgress({
      workspaceId,
      projectId,
      sprintId,
      userId: auth.id,
    });
  }
}
