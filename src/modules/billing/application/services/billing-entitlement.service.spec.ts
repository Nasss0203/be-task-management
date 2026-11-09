import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ErrorCode } from 'src/common/constants/error-code.constant';
import { BILLING_TYPES } from '../../billing.types';
import { BillingFeatureCode } from '../../domain/constants/billing-feature-code.constant';
import { BillingFeatureValueType } from '../../domain/constants/billing-feature-value-type.constant';
import { BillingProvider } from '../../domain/constants/billing-provider.constant';
import { SubscriptionStatus } from '../../domain/constants/subscription-status.constant';
import { BillingFeature } from '../../domain/entities/billing-feature.entity';
import { BillingPlanFeature } from '../../domain/entities/billing-plan-feature.entity';
import { BillingPlan } from '../../domain/entities/billing-plan.entity';
import { WorkspaceSubscription } from '../../domain/entities/workspace-subscription.entity';
import type { WorkspaceUsage } from '../ports/workspace-usage-reader.port';
import { BillingEntitlementService } from './billing-entitlement.service';

const NOW = new Date('2026-11-09T10:00:00.000Z');
const PERIOD_START = new Date('2026-11-01T00:00:00.000Z');
const PERIOD_END = new Date('2026-12-01T00:00:00.000Z');

const freePlan = BillingPlan.create({
  id: 'plan-free',
  code: 'FREE',
  name: 'Free',
});
const plusPlan = BillingPlan.create({
  id: 'plan-plus',
  code: 'PLUS',
  name: 'Plus',
});

const featureDefinitions: Array<[BillingFeatureCode, BillingFeatureValueType]> =
  [
    [BillingFeatureCode.MAX_MEMBERS, BillingFeatureValueType.NUMBER],
    [BillingFeatureCode.MAX_TEAMSPACES, BillingFeatureValueType.NUMBER],
    [BillingFeatureCode.MAX_STORAGE_MB, BillingFeatureValueType.NUMBER],
    [BillingFeatureCode.PUBLIC_PAGE, BillingFeatureValueType.BOOLEAN],
    [BillingFeatureCode.AI_REQUESTS_MONTHLY, BillingFeatureValueType.NUMBER],
  ];

const features = featureDefinitions.map(([code, valueType]) =>
  BillingFeature.create({ id: `feature-${code}`, code, name: code, valueType }),
);

const planValues: Record<string, Record<string, number | boolean>> = {
  'plan-free': {
    MAX_MEMBERS: 5,
    MAX_TEAMSPACES: 1,
    MAX_STORAGE_MB: 500,
    PUBLIC_PAGE: false,
    AI_REQUESTS_MONTHLY: 30,
  },
  'plan-plus': {
    MAX_MEMBERS: 25,
    MAX_TEAMSPACES: 10,
    MAX_STORAGE_MB: 10000,
    PUBLIC_PAGE: true,
    AI_REQUESTS_MONTHLY: 500,
  },
};

function planFeaturesOf(planId: string): BillingPlanFeature[] {
  return Object.entries(planValues[planId]).map(([code, value]) =>
    BillingPlanFeature.create({
      planId,
      featureId: `feature-${code}`,
      value,
    }),
  );
}

function plusSubscription(
  overrides: Partial<{
    status: SubscriptionStatus;
    currentPeriodEnd: Date;
  }> = {},
): WorkspaceSubscription {
  return WorkspaceSubscription.reconstitute({
    id: 'subscription-1',
    workspaceId: 'workspace-1',
    planId: 'plan-plus',
    planPriceId: 'price-plus',
    provider: BillingProvider.SEPAY,
    status: overrides.status ?? SubscriptionStatus.ACTIVE,
    currentPeriodStart: PERIOD_START,
    currentPeriodEnd: overrides.currentPeriodEnd ?? PERIOD_END,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    createdAt: PERIOD_START,
    updatedAt: PERIOD_START,
  });
}

describe('BillingEntitlementService', () => {
  let service: BillingEntitlementService;
  let usage: WorkspaceUsage;

  const subscriptionRepository = { findByWorkspaceId: jest.fn() };
  const planRepository = {
    findById: jest.fn((id: string) =>
      Promise.resolve(
        [freePlan, plusPlan].find((p) => p.getId() === id) ?? null,
      ),
    ),
    findByCode: jest.fn((code: string) =>
      Promise.resolve(code === 'FREE' ? freePlan : null),
    ),
  };
  const featureRepository = {
    findAll: jest.fn(() => Promise.resolve(features)),
  };
  const planFeatureRepository = {
    findByPlanId: jest.fn((planId: string) =>
      Promise.resolve(planFeaturesOf(planId)),
    ),
  };
  const usageReader = { getUsage: jest.fn(() => Promise.resolve(usage)) };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: NOW });
    usage = { members: 2, teamspaces: 1, storageBytes: 0, aiRequests: 0 };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingEntitlementService,
        {
          provide: BILLING_TYPES.repositories.WorkspaceSubscriptionRepository,
          useValue: subscriptionRepository,
        },
        {
          provide: BILLING_TYPES.repositories.BillingPlanRepository,
          useValue: planRepository,
        },
        {
          provide: BILLING_TYPES.repositories.BillingFeatureRepository,
          useValue: featureRepository,
        },
        {
          provide: BILLING_TYPES.repositories.BillingPlanFeatureRepository,
          useValue: planFeatureRepository,
        },
        {
          provide: BILLING_TYPES.services.WorkspaceUsageReader,
          useValue: usageReader,
        },
      ],
    }).compile();

    service = module.get(BillingEntitlementService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses the paid plan and its billing period while the period is running', async () => {
    subscriptionRepository.findByWorkspaceId.mockResolvedValue(
      plusSubscription(),
    );

    const result = await service.getEntitlements('workspace-1');

    expect(result.plan.code).toBe('PLUS');
    expect(result.periodEnd).toEqual(PERIOD_END);
    expect(result.usagePeriod).toEqual({
      start: PERIOD_START,
      end: PERIOD_END,
    });
    expect(usageReader.getUsage).toHaveBeenCalledWith(
      'workspace-1',
      { start: PERIOD_START, end: PERIOD_END },
      NOW,
    );
  });

  it('falls back to FREE and the calendar month once the paid period has ended', async () => {
    subscriptionRepository.findByWorkspaceId.mockResolvedValue(
      plusSubscription({
        currentPeriodEnd: new Date('2026-11-09T09:59:59.000Z'),
      }),
    );

    const result = await service.getEntitlements('workspace-1');

    expect(result.plan.code).toBe('FREE');
    expect(result.periodEnd).toBeNull();
    expect(result.usagePeriod).toEqual({
      start: new Date('2026-11-01T00:00:00.000Z'),
      end: new Date('2026-12-01T00:00:00.000Z'),
    });
  });

  it.each([
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.CANCELED,
    SubscriptionStatus.EXPIRED,
  ])('treats a %s subscription as FREE', async (status) => {
    subscriptionRepository.findByWorkspaceId.mockResolvedValue(
      plusSubscription({ status }),
    );

    const result = await service.getEntitlements('workspace-1');

    expect(result.plan.code).toBe('FREE');
  });

  it('uses FREE when the workspace has no subscription row', async () => {
    subscriptionRepository.findByWorkspaceId.mockResolvedValue(null);

    const result = await service.getEntitlements('workspace-1');

    expect(result.plan.code).toBe('FREE');
  });

  it('reads limits from the database and reports usage in the limit unit', async () => {
    subscriptionRepository.findByWorkspaceId.mockResolvedValue(null);
    planValues['plan-free'].MAX_MEMBERS = 6;
    usage = {
      members: 3,
      teamspaces: 1,
      storageBytes: 5 * 1024 * 1024,
      aiRequests: 7,
    };

    const result = await service.getEntitlements('workspace-1');
    planValues['plan-free'].MAX_MEMBERS = 5;

    const byCode = Object.fromEntries(result.features.map((f) => [f.code, f]));
    expect(byCode.MAX_MEMBERS).toMatchObject({ limit: 6, usage: 3 });
    expect(byCode.MAX_STORAGE_MB).toMatchObject({ limit: 500, usage: 5 });
    expect(byCode.AI_REQUESTS_MONTHLY).toMatchObject({ limit: 30, usage: 7 });
    expect(byCode.PUBLIC_PAGE).toMatchObject({ limit: false, usage: null });
  });

  it('allows an action that stays within the limit', async () => {
    subscriptionRepository.findByWorkspaceId.mockResolvedValue(null);
    usage = { members: 4, teamspaces: 0, storageBytes: 0, aiRequests: 0 };

    await expect(
      service.assertWithinLimit('workspace-1', BillingFeatureCode.MAX_MEMBERS),
    ).resolves.toBeUndefined();
  });

  it('rejects an action that would exceed a numeric limit with the limit details', async () => {
    subscriptionRepository.findByWorkspaceId.mockResolvedValue(null);
    usage = { members: 5, teamspaces: 0, storageBytes: 0, aiRequests: 0 };

    const error = await service
      .assertWithinLimit('workspace-1', BillingFeatureCode.MAX_MEMBERS)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(403);
    expect((error as HttpException).getResponse()).toMatchObject({
      code: ErrorCode.WORKSPACE_LIMIT_EXCEEDED,
      details: { feature: 'MAX_MEMBERS', limit: 5, usage: 5 },
    });
  });

  it('rejects a disabled boolean feature and allows it on a plan that has it', async () => {
    subscriptionRepository.findByWorkspaceId.mockResolvedValue(null);
    await expect(
      service.assertWithinLimit('workspace-1', BillingFeatureCode.PUBLIC_PAGE),
    ).rejects.toBeInstanceOf(HttpException);

    subscriptionRepository.findByWorkspaceId.mockResolvedValue(
      plusSubscription(),
    );
    await expect(
      service.assertWithinLimit('workspace-1', BillingFeatureCode.PUBLIC_PAGE),
    ).resolves.toBeUndefined();
  });

  it('does not block a feature the plan has no value for', async () => {
    subscriptionRepository.findByWorkspaceId.mockResolvedValue(null);
    planFeatureRepository.findByPlanId.mockResolvedValueOnce(
      planFeaturesOf('plan-free').filter(
        (planFeature) =>
          planFeature.getFeatureId() !== 'feature-AI_REQUESTS_MONTHLY',
      ),
    );
    usage = { members: 0, teamspaces: 0, storageBytes: 0, aiRequests: 999 };

    await expect(
      service.assertWithinLimit(
        'workspace-1',
        BillingFeatureCode.AI_REQUESTS_MONTHLY,
      ),
    ).resolves.toBeUndefined();
  });
});
