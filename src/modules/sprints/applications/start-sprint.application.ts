import { Inject, Injectable } from '@nestjs/common';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  StartSprintApplication,
  StartSprintApplicationInput,
} from '../interfaces/applications/start-sprint.application.interface';
import { type StartSprintService } from '../interfaces/services/start-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class StartSprintApplicationImpl implements StartSprintApplication {
  constructor(
    @Inject(SPRINT_TYPES.services.StartSprintService)
    private readonly startSprintService: StartSprintService,
  ) {}

  async start(input: StartSprintApplicationInput): Promise<SprintResponseDto> {
    const sprint = await this.startSprintService.startSprint({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      sprintId: input.sprintId,
    });

    return SprintsMapper.toResponse(sprint);
  }
}
