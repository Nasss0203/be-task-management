import { Inject, Injectable } from '@nestjs/common';
import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { ActivityModel } from '../../domain/entities/activity.entity';
import { type ActivityRepository } from '../../domain/repositories/activity.repository';
import {
  CreateActivityService,
  CreateActivityServiceInput,
} from '../ports/create-activity.service.port';
import { ACTIVITY_TYPES } from '../../activity.types';

@Injectable()
export class CreateActivityServiceImpl implements CreateActivityService {
  constructor(
    @Inject(ACTIVITY_TYPES.repositories.ActivityRepository)
    private readonly activityRepository: ActivityRepository,
  ) {}

  async create(
    input: CreateActivityServiceInput,
    context?: PersistenceContext,
  ): Promise<ActivityModel> {
    return await this.activityRepository.save(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId ?? null,

        entityType: input.entityType,
        entityId: input.entityId,

        actorId: input.actorId ?? null,
        action: input.action,

        field: input.field ?? null,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,

        metadata: input.metadata ?? null,
        isSystem: input.isSystem ?? false,
      },
      context,
    );
  }
}
