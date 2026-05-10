import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ActivityModel } from '../domain/models/activity.model';
import { type CreateActivityRepository } from '../interfaces/repositories/create-activity.repository.interface';
import {
  CreateActivityService,
  CreateActivityServiceInput,
} from '../interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from '../interfaces/types';

@Injectable()
export class CreateActivityServiceImpl implements CreateActivityService {
  constructor(
    @Inject(ACTIVITY_TYPES.repositories.CreateActivityRepository)
    private readonly createActivityRepository: CreateActivityRepository,
  ) {}

  async create(
    input: CreateActivityServiceInput,
    manager?: EntityManager,
  ): Promise<ActivityModel> {
    return await this.createActivityRepository.save(
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
      manager,
    );
  }
}
