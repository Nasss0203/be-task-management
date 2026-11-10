import { Inject, Injectable, Logger } from '@nestjs/common';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { BILLING_TYPES } from '../../../../billing.types';
import { BILLING_TIME_ZONE } from '../../../../domain/constants/subscription-expiry.constant';
import { SubscriptionStatus } from '../../../../domain/constants/subscription-status.constant';
import type { BillingPlanRepository } from '../../../../domain/repositories/billing-plan.repository';
import type { WorkspaceSubscriptionRepository } from '../../../../domain/repositories/workspace-subscription.repository';
import type {
  SubscriptionExpiryCandidate,
  SubscriptionExpiryReader,
} from '../../../ports/subscription-expiry-reader.port';
import type { SubscriptionNoticeSender } from '../../../ports/subscription-notice-sender.port';
import { ProcessSubscriptionExpiryCommand } from './process-subscription-expiry.command';

const FREE_PLAN_CODE = 'FREE';

type ExpiryNotice = {
  workspaceId: string;
  planId: string;
  recipientUserId: string | null;
  expiredAt: Date;
  downgradeAt: Date;
};

type ExpiryOutcome = {
  kind: 'REMINDER' | 'DOWNGRADE';
  notice: ExpiryNotice | null;
};

export type SubscriptionExpiryResult = {
  reminded: number;
  downgraded: number;
  failed: number;
};

const billingDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: BILLING_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

@Injectable()
export class ProcessSubscriptionExpiryHandler {
  private readonly logger = new Logger(ProcessSubscriptionExpiryHandler.name);

  constructor(
    @Inject(BILLING_TYPES.repositories.WorkspaceSubscriptionRepository)
    private readonly subscriptionRepository: WorkspaceSubscriptionRepository,

    @Inject(BILLING_TYPES.repositories.BillingPlanRepository)
    private readonly planRepository: BillingPlanRepository,

    @Inject(BILLING_TYPES.services.SubscriptionExpiryReader)
    private readonly expiryReader: SubscriptionExpiryReader,

    @Inject(BILLING_TYPES.services.SubscriptionNoticeSender)
    private readonly noticeSender: SubscriptionNoticeSender,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: ProcessSubscriptionExpiryCommand,
  ): Promise<SubscriptionExpiryResult> {
    const result: SubscriptionExpiryResult = {
      reminded: 0,
      downgraded: 0,
      failed: 0,
    };
    const candidates = await this.expiryReader.findDue(command.now);

    if (candidates.length === 0) {
      return result;
    }

    const freePlan = await this.planRepository.findByCode(FREE_PLAN_CODE);

    if (!freePlan) {
      throw new Error('FREE billing plan is not configured');
    }

    for (const candidate of candidates) {
      try {
        const outcome = await this.unitOfWork.runInTransaction((context) =>
          this.processCandidate(
            candidate,
            command.now,
            freePlan.getId(),
            context,
          ),
        );

        if (!outcome) continue;

        if (outcome.kind === 'REMINDER') result.reminded += 1;
        else result.downgraded += 1;

        if (outcome.notice) await this.sendNotice(outcome.kind, outcome.notice);
      } catch (error) {
        result.failed += 1;
        this.logger.error(
          `Subscription ${candidate.subscriptionId} expiry failed: ${(error as Error).message}`,
        );
      }
    }

    return result;
  }

  private async processCandidate(
    candidate: SubscriptionExpiryCandidate,
    now: Date,
    freePlanId: string,
    context: PersistenceContext,
  ): Promise<ExpiryOutcome | null> {
    const subscription = await this.subscriptionRepository.findByIdForUpdate(
      candidate.subscriptionId,
      context,
    );
    const periodEnd = subscription?.getCurrentPeriodEnd();
    const status = subscription?.getStatus();

    if (
      !subscription ||
      !subscription.isPaid() ||
      !periodEnd ||
      periodEnd.getTime() > now.getTime() ||
      (status !== SubscriptionStatus.ACTIVE &&
        status !== SubscriptionStatus.PAST_DUE)
    ) {
      return null;
    }

    const silent =
      subscription.getCancelAtPeriodEnd() || candidate.workspaceInTrash;
    const downgradeAt = silent ? periodEnd : subscription.getAccessEndsAt()!;
    const notice: ExpiryNotice = {
      workspaceId: subscription.getWorkspaceId(),
      planId: subscription.getPlanId(),
      recipientUserId: subscription.getBillingContactUserId(),
      expiredAt: periodEnd,
      downgradeAt,
    };

    if (now.getTime() >= downgradeAt.getTime()) {
      subscription.expire(now);
      subscription.fallbackToFree(freePlanId, now);
      await this.subscriptionRepository.save(subscription, context);

      return { kind: 'DOWNGRADE', notice: silent ? null : notice };
    }

    subscription.markPastDue(now);
    const today = billingDay.format(now);

    if (subscription.getExpiryNoticeSentOn() === today) {
      await this.subscriptionRepository.save(subscription, context);
      return null;
    }

    subscription.markExpiryNoticeSent(today, now);
    await this.subscriptionRepository.save(subscription, context);

    return { kind: 'REMINDER', notice };
  }

  private async sendNotice(
    kind: ExpiryOutcome['kind'],
    notice: ExpiryNotice,
  ): Promise<void> {
    const details = notice.recipientUserId
      ? await this.expiryReader.findNoticeDetails({
          workspaceId: notice.workspaceId,
          planId: notice.planId,
          recipientUserId: notice.recipientUserId,
        })
      : null;

    if (!details) {
      this.logger.warn(
        `Workspace ${notice.workspaceId} has no billing contact to notify`,
      );
      return;
    }

    try {
      if (kind === 'REMINDER') {
        await this.noticeSender.sendExpiryReminder({
          ...details,
          expiredAt: notice.expiredAt,
          downgradeAt: notice.downgradeAt,
        });
      } else {
        await this.noticeSender.sendDowngradeNotice({
          ...details,
          downgradedAt: notice.downgradeAt,
        });
      }
    } catch (error) {
      this.logger.error(
        `Workspace ${notice.workspaceId} ${kind} email failed: ${(error as Error).message}`,
      );
    }
  }
}
