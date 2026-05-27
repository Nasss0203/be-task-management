import { EntityManager } from 'typeorm';
import { Plan } from '../../../domain/entities/plan.entity';
import { SubscriptionWorkspace } from '../../../domain/entities/subscription-workspace.entity';
import { Subscription } from '../../../domain/entities/subscription.entity';
import { UsageLimit } from '../../../domain/entities/usage-limit.entity';

export interface WorkspaceLimitRepository {
  countActiveWorkspacesByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<number>;

  findActiveSubscription(
    userId: string,
    manager?: EntityManager,
  ): Promise<Subscription | null>;

  findActivePlanById(
    planId: string,
    manager?: EntityManager,
  ): Promise<Plan | null>;

  findActivePlanBySlug(
    slug: string,
    manager?: EntityManager,
  ): Promise<Plan | null>;

  countSubscriptionWorkspaces(
    subscriptionId: string,
    manager?: EntityManager,
  ): Promise<number>;

  findSubscriptionWorkspaceByWorkspaceId(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<SubscriptionWorkspace | null>;

  createSubscriptionWorkspace(input: {
    subscriptionId: string;
    workspaceId: string;
  }): SubscriptionWorkspace;

  saveSubscriptionWorkspace(
    subscriptionWorkspace: SubscriptionWorkspace,
    manager?: EntityManager,
  ): Promise<SubscriptionWorkspace>;

  findUsageLimit(
    workspaceId: string,
    resourceType: UsageLimit['resourceType'],
    manager?: EntityManager,
  ): Promise<UsageLimit | null>;

  createUsageLimit(input: Partial<UsageLimit>): UsageLimit;

  saveUsageLimit(
    usageLimit: UsageLimit,
    manager?: EntityManager,
  ): Promise<UsageLimit>;
}
