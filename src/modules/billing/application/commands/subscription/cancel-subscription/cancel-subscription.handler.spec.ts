import { BadRequestException } from '@nestjs/common';

import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { WorkspaceSubscription } from '../../../../domain/entities/workspace-subscription.entity';
import { ResumeSubscriptionCommand } from '../resume-subscription/resume-subscription.command';
import { ResumeSubscriptionHandler } from '../resume-subscription/resume-subscription.handler';
import { CancelSubscriptionCommand } from './cancel-subscription.command';
import { CancelSubscriptionHandler } from './cancel-subscription.handler';

describe('Cancel and resume subscription', () => {
  let subscription: WorkspaceSubscription;

  const subscriptionRepository = {
    findByWorkspaceId: jest.fn(() => Promise.resolve(subscription)),
    findByIdForUpdate: jest.fn(() => Promise.resolve(subscription)),
    save: jest.fn(() => Promise.resolve()),
  };
  const unitOfWork = {
    runInTransaction: jest.fn((work: (context: unknown) => unknown) =>
      work('tx'),
    ),
  };
  const cancel = new CancelSubscriptionHandler(
    subscriptionRepository as never,
    unitOfWork as never,
  );
  const resume = new ResumeSubscriptionHandler(
    subscriptionRepository as never,
    unitOfWork as never,
  );

  function activate(periodEnd: Date) {
    subscription.activatePaidPlan({
      planId: 'plan-plus',
      planPriceId: 'price-plus',
      provider: BillingProvider.SEPAY,
      periodStart: new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000),
      periodEnd,
      billingContactUserId: 'owner-1',
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    subscription = WorkspaceSubscription.createInitialFree({
      id: 'subscription-1',
      workspaceId: 'workspace-1',
      planId: 'plan-free',
    });
  });

  it('schedules the cancellation of an active paid plan', async () => {
    activate(new Date('2099-01-01T00:00:00.000Z'));

    await cancel.execute(new CancelSubscriptionCommand('workspace-1'));

    expect(subscription.getCancelAtPeriodEnd()).toBe(true);
    expect(subscriptionRepository.findByIdForUpdate).toHaveBeenCalledWith(
      'subscription-1',
      'tx',
    );
  });

  it('rejects cancelling a FREE workspace', async () => {
    await expect(
      cancel.execute(new CancelSubscriptionCommand('workspace-1')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects cancelling a past due plan', async () => {
    activate(new Date('2020-01-01T00:00:00.000Z'));
    subscription.markPastDue();

    await expect(
      cancel.execute(new CancelSubscriptionCommand('workspace-1')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resumes a cancelled plan and makes the caller the billing contact', async () => {
    activate(new Date('2099-01-01T00:00:00.000Z'));
    subscription.scheduleCancellation();

    await resume.execute(
      new ResumeSubscriptionCommand('workspace-1', 'owner-2'),
    );

    expect(subscription.getCancelAtPeriodEnd()).toBe(false);
    expect(subscription.getBillingContactUserId()).toBe('owner-2');
  });

  it('rejects resuming a plan that is not scheduled for cancellation', async () => {
    activate(new Date('2099-01-01T00:00:00.000Z'));

    await expect(
      resume.execute(new ResumeSubscriptionCommand('workspace-1', 'owner-2')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects resuming after the period has ended', async () => {
    activate(new Date('2020-01-01T00:00:00.000Z'));
    subscription.scheduleCancellation();

    await expect(
      resume.execute(new ResumeSubscriptionCommand('workspace-1', 'owner-2')),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });
});
