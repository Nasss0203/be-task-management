import { Test, TestingModule } from '@nestjs/testing';

import { BILLING_TYPES } from '../../../../billing.types';
import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { SubscriptionStatus } from '../../../../domain/constants/subscription-status.constant';
import { BillingPlan } from '../../../../domain/entities/billing-plan.entity';
import { WorkspaceSubscription } from '../../../../domain/entities/workspace-subscription.entity';
import { GetWorkspaceSubscriptionHandler } from './get-workspace-subscription.handler';
import { GetWorkspaceSubscriptionQuery } from './get-workspace-subscription.query';

describe('GetWorkspaceSubscriptionHandler', () => {
  let handler: GetWorkspaceSubscriptionHandler;

  const mockWorkspaceSubscriptionRepository = {
    findByWorkspaceId: jest.fn(),
  };

  const mockBillingPlanRepository = {
    findById: jest.fn(),
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetWorkspaceSubscriptionHandler,
        {
          provide: BILLING_TYPES.repositories.WorkspaceSubscriptionRepository,
          useValue: mockWorkspaceSubscriptionRepository,
        },
        {
          provide: BILLING_TYPES.repositories.BillingPlanRepository,
          useValue: mockBillingPlanRepository,
        },
      ],
    }).compile();

    handler = module.get<GetWorkspaceSubscriptionHandler>(
      GetWorkspaceSubscriptionHandler,
    );
  });

  it('returns the paid subscription with its exact plan metadata', async () => {
    const currentPeriodStart = new Date('2026-09-12T02:00:00.000Z');
    const currentPeriodEnd = new Date('2026-10-12T02:00:00.000Z');
    const subscription = WorkspaceSubscription.reconstitute({
      id: 'subscription-plus',
      workspaceId: 'workspace-1',
      planId: 'plan-plus',
      planPriceId: 'price-plus-monthly',
      provider: BillingProvider.SEPAY,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      providerCustomerId: null,
      providerSubscriptionId: null,
      createdAt: new Date('2026-09-12T02:00:00.000Z'),
      updatedAt: new Date('2026-09-12T02:01:00.000Z'),
    });
    const plan = BillingPlan.create({
      id: 'plan-plus',
      code: 'PLUS',
      name: 'Plus',
      description: 'For growing teams.',
    });

    mockWorkspaceSubscriptionRepository.findByWorkspaceId.mockResolvedValue(
      subscription,
    );
    mockBillingPlanRepository.findById.mockResolvedValue(plan);

    const result = await handler.execute(
      new GetWorkspaceSubscriptionQuery('workspace-1'),
    );

    expect(
      mockWorkspaceSubscriptionRepository.findByWorkspaceId,
    ).toHaveBeenCalledWith('workspace-1');
    expect(mockBillingPlanRepository.findById).toHaveBeenCalledWith(
      'plan-plus',
    );
    expect(mockBillingPlanRepository.findByCode).not.toHaveBeenCalled();
    expect(result).toEqual({
      subscriptionId: 'subscription-plus',
      workspaceId: 'workspace-1',
      plan: {
        id: 'plan-plus',
        code: 'PLUS',
        name: 'Plus',
      },
      planPriceId: 'price-plus-monthly',
      provider: BillingProvider.SEPAY,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    });
  });

  it('returns a virtual FREE subscription when none exists', async () => {
    const freePlan = BillingPlan.create({
      id: 'plan-free',
      code: 'FREE',
      name: 'Free',
      description: 'For individuals and small teams.',
    });

    mockWorkspaceSubscriptionRepository.findByWorkspaceId.mockResolvedValue(
      null,
    );
    mockBillingPlanRepository.findByCode.mockResolvedValue(freePlan);

    const result = await handler.execute(
      new GetWorkspaceSubscriptionQuery('workspace-without-subscription'),
    );

    expect(
      mockWorkspaceSubscriptionRepository.findByWorkspaceId,
    ).toHaveBeenCalledWith('workspace-without-subscription');
    expect(mockBillingPlanRepository.findByCode).toHaveBeenCalledWith('FREE');
    expect(mockBillingPlanRepository.findById).not.toHaveBeenCalled();
    expect(result).toEqual({
      subscriptionId: null,
      workspaceId: 'workspace-without-subscription',
      plan: {
        id: 'plan-free',
        code: 'FREE',
        name: 'Free',
      },
      planPriceId: null,
      provider: null,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  });
});
