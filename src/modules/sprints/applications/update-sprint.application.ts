// src/modules/sprints/applications/update-sprint.application.ts

import { Inject, Injectable } from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { DataSource } from 'typeorm';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  UpdateSprintApplication,
  UpdateSprintApplicationInput,
} from '../interfaces/applications/update-sprint.application.interface';
import { type UpdateSprintService } from '../interfaces/services/udpdate-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class UpdateSprintApplicationImpl implements UpdateSprintApplication {
  constructor(
    private readonly dataSource: DataSource,

    @Inject(SPRINT_TYPES.services.UpdateSprintService)
    private readonly updateSprintService: UpdateSprintService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async updateSprint(
    input: UpdateSprintApplicationInput,
  ): Promise<SprintResponseDto> {
    const updatedSprint = await this.dataSource.transaction(async (manager) => {
      const updatedSprint = await this.updateSprintService.updateSprint(
        {
          id: input.sprintId,
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          name: input.name,
          goal: input.goal,
          startAt: input.startAt,
          endAt: input.endAt,
        },
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: updatedSprint.workspaceId,
          projectId: updatedSprint.projectId,
          entityType: ActivityEntityType.SPRINT,
          entityId: updatedSprint.id,
          actorId: input.userId,
          action: ActivityAction.SPRINT_UPDATED,
          metadata: {
            name: updatedSprint.name,
            goal: updatedSprint.goal,
            startAt: updatedSprint.startAt,
            endAt: updatedSprint.endAt,
          },
        },
        manager,
      );

      return updatedSprint;
    });

    return SprintsMapper.toResponse(updatedSprint);
  }
}
