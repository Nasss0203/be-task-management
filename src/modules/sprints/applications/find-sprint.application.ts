import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  FindAllSprintApplicationInput,
  FindSprintApplication,
  FindTasksBySprintApplicationInput,
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

  async findTasksBySprint(
    input: FindTasksBySprintApplicationInput,
  ): Promise<SprintResponseDto> {
    const sprint = await this.findSprintService.findTasksBySprint(
      input.workspaceId,
      input.projectId,
      input.sprintId,
    );

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    return SprintsMapper.toResponse(sprint);
  }
}
