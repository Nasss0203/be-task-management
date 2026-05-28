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
  CompleteSprintApplication,
  CompleteSprintApplicationInput,
} from '../interfaces/applications/complete-sprint.application.interface';
import { type CompleteSprintService } from '../interfaces/services/complete-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class CompleteSprintApplicationImpl implements CompleteSprintApplication {
  constructor(
    @Inject(SPRINT_TYPES.services.CompleteSprintService)
    private readonly completeSprintService: CompleteSprintService,

    @Inject(SPRINT_TYPES.uow.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async complete(
    input: CompleteSprintApplicationInput,
  ): Promise<SprintResponseDto> {
    const sprint = await this.unitOfWork.runInTransaction(async (manager) => {
      const sprint = await this.completeSprintService.completeSprint(
        {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          sprintId: input.sprintId,
        },
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: sprint.workspaceId,
          projectId: sprint.projectId,
          entityType: ActivityEntityType.SPRINT,
          entityId: sprint.id,
          actorId: input.userId,
          action: ActivityAction.SPRINT_COMPLETED,
          metadata: {
            name: sprint.name,
            completedAt: sprint.completedAt,
          },
        },
        manager,
      );

      return sprint;
    });

    return SprintsMapper.toResponse(sprint);
  }
}
