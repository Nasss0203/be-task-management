import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import { SprintProgressResponseDto } from '../dto/sprint-progress.response.dto';
import {
  FindAllSprintApplicationInput,
  FindSprintApplication,
  FindTasksBySprintApplicationInput,
  GetSprintProgressApplicationInput,
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

  async findDeletedSprints(
    workspaceId: string,
    projectId?: string,
  ): Promise<SprintResponseDto[]> {
    const sprints = await this.findSprintService.findDeletedSprints(
      workspaceId,
      projectId,
    );

    return sprints.map((sprint) => SprintsMapper.toResponse(sprint));
  }

  async findAllSprintByProject(
    input: FindAllSprintApplicationInput,
  ): Promise<SprintResponseDto[]> {
    const from = input.from ? new Date(input.from) : undefined;
    const to = input.to ? new Date(input.to) : undefined;

    if (from && to && from > to) {
      throw new BadRequestException('from must be less than or equal to to');
    }

    const sprints = await this.findSprintService.findAllSprintByProject(
      input.workspaceId,
      input.projectId,
      {
        keyword: input.keyword,
        status: input.status,
        from,
        to,
      },
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

  async getSprintProgress(
    input: GetSprintProgressApplicationInput,
  ): Promise<SprintProgressResponseDto> {
    const progress = await this.findSprintService.getSprintProgress(
      input.workspaceId,
      input.projectId,
      input.sprintId,
    );

    if (!progress) {
      throw new NotFoundException('Sprint not found');
    }

    return progress;
  }
}
