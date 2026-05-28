import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { SprintStatus } from '../domain/entities/sprint.entity';
import { DeleteSprintApplication } from '../interfaces/applications/delete-sprint.application.interface';
import { type DeleteSprintService } from '../interfaces/services/delete-sprint.service.interface';
import { type FindSprintService } from '../interfaces/services/find-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteSprintApplicationImpl implements DeleteSprintApplication {
  constructor(
    @Inject(SPRINT_TYPES.services.FindSprintService)
    private readonly findSprintService: FindSprintService,

    @Inject(SPRINT_TYPES.services.DeleteSprintService)
    private readonly deleteSprintService: DeleteSprintService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async delete(input: {
    workspaceId: string;
    projectId: string;
    sprintId: string;
    userId: string;
  }): Promise<void> {
    const sprint = await this.findSprintService.findOneSprintForRestore(
      input.workspaceId,
      input.projectId,
      input.sprintId,
    );

    if (!sprint) {
      throw new NotFoundException('Sprint not found in this project');
    }

    if (sprint.deletedAt) {
      throw new BadRequestException('Sprint is already deleted');
    }

    if (sprint.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot delete sprint because workspace is deleted',
      );
    }

    if (sprint.projectDeletedAt) {
      throw new BadRequestException(
        'Cannot delete sprint because project is deleted',
      );
    }

    if (sprint.status === SprintStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot delete active sprint. Complete or cancel it first.',
      );
    }

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot delete completed sprint because it is part of project history.',
      );
    }

    await this.deleteSprintService.softDeleteSprint({
      sprintId: input.sprintId,
      deletedBy: input.userId,
    });

    await this.createActivityService.create({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      entityType: ActivityEntityType.SPRINT,
      entityId: input.sprintId,
      actorId: input.userId,
      action: ActivityAction.SPRINT_DELETED,
    });
  }

  async restore(input: {
    workspaceId: string;
    projectId: string;
    sprintId: string;
    userId: string;
  }): Promise<void> {
    const sprint = await this.findSprintService.findOneSprintForRestore(
      input.workspaceId,
      input.projectId,
      input.sprintId,
    );

    if (!sprint) {
      throw new NotFoundException('Sprint not found in this project');
    }

    if (!sprint.deletedAt) {
      throw new BadRequestException('Sprint is not deleted');
    }

    if (sprint.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot restore sprint because workspace is deleted',
      );
    }

    if (sprint.projectDeletedAt) {
      throw new BadRequestException(
        'Cannot restore sprint because project is deleted',
      );
    }

    await this.deleteSprintService.restoreSprint({
      sprintId: input.sprintId,
    });

    await this.createActivityService.create({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      entityType: ActivityEntityType.SPRINT,
      entityId: input.sprintId,
      actorId: input.userId,
      action: ActivityAction.SPRINT_RESTORED,
    });
  }
}
