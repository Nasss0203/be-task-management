import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
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

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async start(input: StartSprintApplicationInput): Promise<SprintResponseDto> {
    const sprint = await this.startSprintService.startSprint({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      sprintId: input.sprintId,

      startAt: input.dto.startAt,
      endAt: input.dto.endAt,
      name: input.dto.name,
      goal: input.dto.goal,
    });

    await this.createActivityService.create({
      workspaceId: sprint.workspaceId,
      projectId: sprint.projectId,
      entityType: ActivityEntityType.SPRINT,
      entityId: sprint.id,
      actorId: input.userId,
      action: ActivityAction.SPRINT_STARTED,
      metadata: {
        name: sprint.name,
        startAt: sprint.startAt,
        endAt: sprint.endAt,
      },
    });

    this.eventEmitter.emit(REALTIME_EVENTS.SPRINT_UPDATED, {
      workspaceId: sprint.workspaceId,
      projectId: sprint.projectId,
      sprint: sprint,
    });

    return SprintsMapper.toResponse(sprint);
  }
}
