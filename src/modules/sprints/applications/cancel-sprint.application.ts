// src/modules/sprints/applications/cancel-sprint.application.ts

import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  CancelSprintApplication,
  CancelSprintApplicationInput,
} from '../interfaces/applications/cancel-sprint.application.interface';
import { type CancelSprintService } from '../interfaces/services/cancel-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class CancelSprintApplicationImpl implements CancelSprintApplication {
  constructor(
    @Inject(SPRINT_TYPES.uow.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(SPRINT_TYPES.services.CancelSprintService)
    private readonly cancelSprintService: CancelSprintService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async cancelSprint(
    input: CancelSprintApplicationInput,
  ): Promise<SprintResponseDto> {
    const sprint = await this.unitOfWork.runInTransaction(async (manager) => {
      const sprint = await this.cancelSprintService.cancelSprint(input, manager);

      await this.createActivityService.create(
        {
          workspaceId: sprint.workspaceId,
          projectId: sprint.projectId,
          entityType: ActivityEntityType.SPRINT,
          entityId: sprint.id,
          actorId: input.userId,
          action: ActivityAction.SPRINT_CANCELLED,
          metadata: {
            name: sprint.name,
          },
        },
        manager,
      );

      return sprint;
    });

    return SprintsMapper.toResponse(sprint);
  }
}
