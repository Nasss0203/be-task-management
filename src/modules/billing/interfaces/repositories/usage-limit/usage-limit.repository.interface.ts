import { EntityManager } from 'typeorm';
import {
  UsageLimit,
  UsageResourceType,
} from '../../../domain/entities/usage-limit.entity';

export interface UsageLimitRepository {
  findByWorkspaceAndResource(
    workspaceId: string,
    resourceType: UsageResourceType,
    manager?: EntityManager,
  ): Promise<UsageLimit | null>;

  save(usageLimit: UsageLimit, manager?: EntityManager): Promise<UsageLimit>;

  countProjectsByWorkspaceId(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<number>;
}
