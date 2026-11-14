import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { SubscriptionStatus } from '../../../../domain/constants/subscription-status.constant';
import { BillingPlan } from '../../../../domain/entities/billing-plan.entity';
import { WorkspaceSubscription } from '../../../../domain/entities/workspace-subscription.entity';
import { ProcessSubscriptionExpiryCommand } from './process-subscription-expiry.command';
import { ProcessSubscriptionExpiryHandler } from './process-subscription-expiry.handler';

const PERIOD_START = new Date('2026-10-10T01:00:00.000Z');
const PERIOD_END = new Date('2026-11-10T01:00:00.000Z');
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const GRACE_END = new Date(PERIOD_END.getTime() + 3 * DAY_MS);

const details = {
  recipientEmail: 'owner@example.test',
  recipientName: 'Owner',
  workspaceName: 'Team',
  planName: 'Plus',
};

describe('ProcessSubscriptionExpiryHandler', () => {
  let subscription: WorkspaceSubscription;
  let workspaceInTrash: boolean;

  const subscriptionRepository = {
    findByIdForUpdate: jest.fn(() => Promise.resolve(subscription)),
    save: jest.fn(() => Promise.resolve()),
  };
  const planRepository = {
    findByCode: jest.fn(() =>
      Promise.resolve(
        BillingPlan.create({ id: 'plan-free', code: 'FREE', name: 'Free' }),
      ),
    ),
  };
  const expiryReader = {
    findDue: jest.fn(() =>
      Promise.resolve([{ subscriptionId: 'subscription-1', workspaceInTrash }]),
    ),
    findNoticeDetails: jest.fn(() => Promise.resolve(details)),
  };
  const noticeSender = {
    sendExpiryReminder: jest.fn(() => Promise.resolve()),
    sendDowngradeNotice: jest.fn(() => Promise.resolve()),
  };
  const unitOfWork = {
    runInTransaction: jest.fn((work: (context: unknown) => unknown) =>
      work('tx'),
    ),
  };
  const handler = new ProcessSubscriptionExpiryHandler(
    subscriptionRepository as never,
    planRepository as never,
    expiryReader as never,
    noticeSender as never,
    unitOfWork as never,
  );

  function runAt(now: Date) {
    return handler.execute(new ProcessSubscriptionExpiryCommand(now));
  }

  beforeEach(() => {
    jest.clearAllMocks();
    workspaceInTrash = false;
    subscription = WorkspaceSubscription.createInitialFree({
      id: 'subscription-1',
      workspaceId: 'workspace-1',
      planId: 'plan-free',
    });
    subscription.activatePaidPlan({
      planId: 'plan-plus',
      planPriceId: 'price-plus',
      provider: BillingProvider.SEPAY,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      billingContactUserId: 'owner-1',
    });
  });

  it('marks the subscription past due and emails the billing contact', async () => {
    const result = await runAt(new Date(PERIOD_END.getTime() + HOUR_MS));

    expect(result).toEqual({ reminded: 1, downgraded: 0, failed: 0 });
    expect(subscription.getStatus()).toBe(SubscriptionStatus.PAST_DUE);
    expect(subscription.getPlanId()).toBe('plan-plus');
    expect(subscription.getExpiryNoticeSentOn()).toBe('2026-11-10');
    expect(subscriptionRepository.findByIdForUpdate).toHaveBeenCalledWith(
      'subscription-1',
      'tx',
    );
    expect(expiryReader.findNoticeDetails).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      planId: 'plan-plus',
      recipientUserId: 'owner-1',
    });
    expect(noticeSender.sendExpiryReminder).toHaveBeenCalledWith({
      ...details,
      expiredAt: PERIOD_END,
      downgradeAt: GRACE_END,
    });
  });

  it('sends one reminder per Vietnam calendar day', async () => {
    await runAt(new Date(PERIOD_END.getTime() + HOUR_MS));
    const secondRun = await runAt(new Date(PERIOD_END.getTime() + 2 * HOUR_MS));
    const nextDay = await runAt(new Date(PERIOD_END.getTime() + DAY_MS));

    expect(secondRun.reminded).toBe(0);
    expect(nextDay.reminded).toBe(1);
    expect(noticeSender.sendExpiryReminder).toHaveBeenCalledTimes(2);
    expect(subscription.getExpiryNoticeSentOn()).toBe('2026-11-11');
  });

  it('downgrades to FREE once the grace period has ended', async () => {
    await runAt(new Date(PERIOD_END.getTime() + HOUR_MS));
    const result = await runAt(GRACE_END);

    expect(result).toEqual({ reminded: 0, downgraded: 1, failed: 0 });
    expect(subscription.getPlanId()).toBe('plan-free');
    expect(subscription.getStatus()).toBe(SubscriptionStatus.ACTIVE);
    expect(subscription.isPaid()).toBe(false);
    expect(subscription.getBillingContactUserId()).toBeNull();
    expect(noticeSender.sendDowngradeNotice).toHaveBeenCalledWith({
      ...details,
      downgradedAt: GRACE_END,
    });
  });

  it('downgrades directly when the job runs late after the grace period', async () => {
    const result = await runAt(new Date(GRACE_END.getTime() + DAY_MS));

    expect(result.downgraded).toBe(1);
    expect(noticeSender.sendExpiryReminder).not.toHaveBeenCalled();
    expect(subscription.getPlanId()).toBe('plan-free');
  });

  it('downgrades a cancelled subscription at period end without emails', async () => {
    subscription.scheduleCancellation();

    const result = await runAt(new Date(PERIOD_END.getTime() + HOUR_MS));

    expect(result.downgraded).toBe(1);
    expect(subscription.getPlanId()).toBe('plan-free');
    expect(noticeSender.sendExpiryReminder).not.toHaveBeenCalled();
    expect(noticeSender.sendDowngradeNotice).not.toHaveBeenCalled();
  });

  it('downgrades a workspace in trash at period end without emails', async () => {
    workspaceInTrash = true;

    const result = await runAt(new Date(PERIOD_END.getTime() + HOUR_MS));

    expect(result.downgraded).toBe(1);
    expect(noticeSender.sendDowngradeNotice).not.toHaveBeenCalled();
  });

  it('skips a subscription that was renewed before the job ran', async () => {
    const result = await runAt(new Date(PERIOD_END.getTime() - HOUR_MS));

    expect(result).toEqual({ reminded: 0, downgraded: 0, failed: 0 });
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('keeps the state change when the email fails', async () => {
    noticeSender.sendExpiryReminder.mockRejectedValueOnce(new Error('smtp'));

    const result = await runAt(new Date(PERIOD_END.getTime() + HOUR_MS));

    expect(result).toEqual({ reminded: 1, downgraded: 0, failed: 0 });
    expect(subscriptionRepository.save).toHaveBeenCalled();
  });

  it('counts a failed transaction and keeps going', async () => {
    subscriptionRepository.save.mockRejectedValueOnce(new Error('db'));

    const result = await runAt(new Date(PERIOD_END.getTime() + HOUR_MS));

    expect(result).toEqual({ reminded: 0, downgraded: 0, failed: 1 });
    expect(noticeSender.sendExpiryReminder).not.toHaveBeenCalled();
  });

  it('does not load the FREE plan when nothing is due', async () => {
    expiryReader.findDue.mockResolvedValueOnce([]);

    await runAt(new Date(PERIOD_END.getTime() + HOUR_MS));

    expect(planRepository.findByCode).not.toHaveBeenCalled();
  });
});
