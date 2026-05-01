import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  CreateSprintApplication,
  CreateSprintApplicationInput,
} from '../interfaces/applications/create-sprint.application.interface';
import { type CreateSprintService } from '../interfaces/services/create-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class CreateSprintApplicationImpl implements CreateSprintApplication {
  constructor(
    @Inject(SPRINT_TYPES.services.CreateSprintService)
    private readonly createSprintService: CreateSprintService,
  ) {}

  async create(
    input: CreateSprintApplicationInput,
  ): Promise<SprintResponseDto> {
    const { workspaceId, projectId, userId, dto } = input;

    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;

    if (startAt && endAt && startAt >= endAt) {
      throw new BadRequestException('Sprint startAt must be before endAt');
    }

    const sprint = await this.createSprintService.create({
      workspaceId,
      projectId,
      name: dto.name.trim(),
      goal: dto.goal?.trim() || null,
      startAt,
      endAt,
      createdBy: userId,
    });

    return SprintsMapper.toResponse(sprint);
  }
}
