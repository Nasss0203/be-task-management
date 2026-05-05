import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { CreateSprintDto } from '../dto/create-sprint.dto';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import { type CompleteSprintApplication } from '../interfaces/applications/complete-sprint.application.interface';
import { type CreateSprintApplication } from '../interfaces/applications/create-sprint.application.interface';
import { type FindSprintApplication } from '../interfaces/applications/find-sprint.application.interface';
import { type StartSprintApplication } from '../interfaces/applications/start-sprint.application.interface';
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
    @Auth() auth: IAuth,
  ): Promise<SprintResponseDto[]> {
    return this.findSprintApplication.findAllSprintByProject({
      workspaceId,
      projectId,
      userId: auth.id,
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

  @Patch('workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/start')
  @ResponseMessage('Start sprint successfully')
  async startSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Auth() auth: IAuth,
  ): Promise<SprintResponseDto> {
    return this.startSprintApplication.start({
      workspaceId,
      projectId,
      sprintId,
      userId: auth.id,
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
}
