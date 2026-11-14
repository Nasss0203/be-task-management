import { BillingProvider } from '../../domain/constants/billing-provider.constant';
import { WorkspaceSubscription } from '../../domain/entities/workspace-subscription.entity';
import { BillingSubscriptionLifecycleService } from './billing-subscription-lifecycle.service';

describe('BillingSubscriptionLifecycleService', () => {
  let subscription: WorkspaceSubscription | null;

  const subscriptionRepository = {
    findByWorkspaceId: jest.fn(() => Promise.resolve(subscription)),
    findByIdForUpdate: jest.fn(() => Promise.resolve(subscription)),
    save: jest.fn(() => Promise.resolve()),
  };
  const service = new BillingSubscriptionLifecycleService(
    subscriptionRepository as never,
  );

  function freeSubscription() {
    return WorkspaceSubscription.createInitialFree({
      id: 'subscription-1',
      workspaceId: 'workspace-1',
      planId: 'plan-free',
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    subscription = freeSubscription();
    subscription.activatePaidPlan({
      planId: 'plan-plus',
      planPriceId: 'price-plus',
      provider: BillingProvider.SEPAY,
      periodStart: new Date('2026-11-01T00:00:00.000Z'),
      periodEnd: new Date('2026-12-01T00:00:00.000Z'),
      billingContactUserId: 'owner-1',
    });
  });

  it('schedules cancellation under a row lock when the billing contact leaves', async () => {
    await service.handleBillingContactLeft(
      'workspace-1',
      'owner-1',
      'tx' as never,
    );

    expect(subscriptionRepository.findByIdForUpdate).toHaveBeenCalledWith(
      'subscription-1',
      'tx',
    );
    expect(subscription!.getCancelAtPeriodEnd()).toBe(true);
    expect(subscriptionRepository.save).toHaveBeenCalledWith(
      subscription,
      'tx',
    );
  });

  it('keeps the plan when another member leaves', async () => {
    await service.handleBillingContactLeft('workspace-1', 'member-2');

    expect(subscription!.getCancelAtPeriodEnd()).toBe(false);
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('schedules cancellation when the workspace is deleted', async () => {
    await service.handleWorkspaceDeleted('workspace-1');

    expect(subscription!.getCancelAtPeriodEnd()).toBe(true);
    expect(subscriptionRepository.findByIdForUpdate).not.toHaveBeenCalled();
  });

  it('does nothing for a FREE workspace', async () => {
    subscription = freeSubscription();

    await service.handleWorkspaceDeleted('workspace-1');

    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('does nothing when the cancellation is already scheduled', async () => {
    subscription!.scheduleCancellation();

    await service.handleWorkspaceDeleted('workspace-1');

    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('does nothing when the workspace has no subscription', async () => {
    subscription = null;

    await expect(
      service.handleWorkspaceDeleted('workspace-1'),
    ).resolves.toBeUndefined();
  });
});
