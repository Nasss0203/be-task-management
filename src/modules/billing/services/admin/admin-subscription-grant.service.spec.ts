
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { DataSource, EntityManager } from 'typeorm';

import { Plan } from '../../domain/entities/plan.entity';
import { SubscriptionWorkspace } from '../../domain/entities/subscription-workspace.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';
import { UsageLimit } from '../../domain/entities/usage-limit.entity';
import {
  PlanTypeWorkspace,
  Workspace,
} from '../../../workspaces/domain/entities/workspace.entity';
import { AdminSubscriptionGrantService } from './admin-subscription-grant.service';

describe('AdminSubscriptionGrantService expiration', () => {
  it('expires due subscriptions and downgrades their workspaces to free', async () => {
    const subscription = {
      id: 'subscription-id',
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: true,
      metadata: null,
    } as Subscription;
    const subscriptionWorkspace = {
      subscriptionId: subscription.id,
      workspaceId: 'workspace-id',
    } as SubscriptionWorkspace;
    const workspace = {
      id: subscriptionWorkspace.workspaceId,
      planType: PlanTypeWorkspace.PRO,
    } as Workspace;
    const freePlan = {
      id: 'free-plan-id',
      slug: 'free',
      limits: {},
    } as Plan;

    const queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([subscription]),
    };
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      find: jest.fn().mockResolvedValue([subscriptionWorkspace]),
      remove: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockImplementation((entity) => {
        if (entity === Workspace) return Promise.resolve(workspace);
        if (entity === Plan) return Promise.resolve(freePlan);
        if (entity === UsageLimit) return Promise.resolve(null);
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation((_entity, value) => value),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    } as unknown as DataSource;
    const service = new AdminSubscriptionGrantService(dataSource);
    const now = new Date('2026-06-22T00:00:00.000Z');

    const result = await service.expireDueSubscriptions(now);

    expect(result).toEqual({
      expiredSubscriptionIds: [subscription.id],
      affectedWorkspaceIds: [workspace.id],
    });
    expect(manager.remove).toHaveBeenCalledWith([subscriptionWorkspace]);
    expect(workspace.planType).toBe(PlanTypeWorkspace.FREE);
    expect(subscription.status).toBe(SubscriptionStatus.EXPIRED);
    expect(subscription.cancelAtPeriodEnd).toBe(false);
    expect(subscription.metadata).toEqual({
      expiration: {
        source: 'subscription_expired',
        expiredAt: now.toISOString(),
        affectedWorkspaceIds: [workspace.id],
      },
    });
    expect(manager.create).toHaveBeenCalledWith(
      UsageLimit,
      expect.objectContaining({
        workspaceId: workspace.id,
        planId: freePlan.id,
        metadata: expect.objectContaining({
          source: 'subscription_expired',
          planSlug: 'free',
        }),
      }),
    );

  });
});
