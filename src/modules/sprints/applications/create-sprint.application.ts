import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
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

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async create(
    input: CreateSprintApplicationInput,
  ): Promise<SprintResponseDto> {
    const { workspaceId, projectId, userId, dto } = input;

    const name = dto.name?.trim();

    if (!name) {
      throw new BadRequestException('Sprint name is required');
    }

    const goal = dto.goal !== undefined ? dto.goal.trim() || null : undefined;

    const startAt =
      dto.startAt !== undefined && dto.startAt !== null
        ? new Date(dto.startAt)
        : undefined;

    const endAt =
      dto.endAt !== undefined && dto.endAt !== null
        ? new Date(dto.endAt)
        : undefined;

    if (startAt && Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid sprint startAt');
    }

    if (endAt && Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid sprint endAt');
    }

    if (startAt && endAt && startAt >= endAt) {
      throw new BadRequestException('Sprint startAt must be before endAt');
    }

    const createdSprint = await this.createSprintService.create({
      workspaceId,
      projectId,
      name,
      createdBy: userId,

      ...(goal !== undefined && { goal }),
      ...(startAt !== undefined && { startAt }),
      ...(endAt !== undefined && { endAt }),
    });

    await this.createActivityService.create({
      workspaceId: createdSprint.workspaceId,
      projectId: createdSprint.projectId,
      entityType: ActivityEntityType.SPRINT,
      entityId: createdSprint.id,
      actorId: userId,
      action: ActivityAction.SPRINT_CREATED,
      metadata: {
        name: createdSprint.name,
        goal: createdSprint.goal,
        startAt: createdSprint.startAt,
        endAt: createdSprint.endAt,
      },
    });

    return SprintsMapper.toResponse(createdSprint);
  }
}
