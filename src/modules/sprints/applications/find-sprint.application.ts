import { Inject, Injectable } from '@nestjs/common';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  FindAllSprintApplicationInput,
  FindSprintApplication,
} from '../interfaces/applications/find-sprint.application.interface';
import { type FindSprintService } from '../interfaces/services/find-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class FindSprintApplicationImpl implements FindSprintApplication {
  constructor(
    @Inject(SPRINT_TYPES.services.FindSprintService)
    private readonly findSprintService: FindSprintService,
  ) {}

  async findAllSprintByProject(
    input: FindAllSprintApplicationInput,
  ): Promise<SprintResponseDto[]> {
    const sprints = await this.findSprintService.findAllSprintByProject(
      input.workspaceId,
      input.projectId,
    );

    return sprints.map((sprint) => SprintsMapper.toResponse(sprint));
  }
}
