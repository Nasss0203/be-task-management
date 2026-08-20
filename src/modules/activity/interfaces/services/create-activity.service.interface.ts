// src/modules/activities/interfaces/services/create-activity.service.interface.ts

import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import {
  ActivityAction,
  ActivityEntityType,
} from '../../domain/entities/activity.entity';
import { ActivityModel } from '../../domain/models/activity.model';

export type CreateActivityServiceInput = {
  workspaceId: string;
  projectId?: string | null;
  entityType: ActivityEntityType;
  entityId: string;
  actorId?: string | null;
  action: ActivityAction;
  field?: string | null;
  oldValue?: unknown | null;
  newValue?: unknown | null;
  metadata?: Record<string, unknown> | null;
  isSystem?: boolean;
};

export interface CreateActivityService {
  create(
    input: CreateActivityServiceInput,
    context?: PersistenceContext,
  ): Promise<ActivityModel>;
}
