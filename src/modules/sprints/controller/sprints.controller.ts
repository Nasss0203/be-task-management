import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
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
import { SPRINT_TYPES } from '../interfaces/types';

@Controller('sprints')
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
  ) {}

  @Post('workspaces/:workspaceId/projects/:projectId')
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
  async cancelSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
  ): Promise<SprintResponseDto> {
    return await this.cancelSprintApplication.cancelSprint({
      workspaceId,
      projectId,
      sprintId,
    });
  }

  @Patch('workspaces/:workspaceId/projects/:projectId/sprint/:sprintId')
  async updateSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Body() body: UpdateSprintDto,
  ): Promise<SprintResponseDto> {
    return await this.updateSprintApplication.updateSprint({
      workspaceId,
      projectId,
      sprintId,
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
