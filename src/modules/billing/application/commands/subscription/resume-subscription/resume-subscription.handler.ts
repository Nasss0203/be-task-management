import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { BILLING_TYPES } from '../../../../billing.types';
import { SubscriptionStatus } from '../../../../domain/constants/subscription-status.constant';
import type { WorkspaceSubscriptionRepository } from '../../../../domain/repositories/workspace-subscription.repository';
import { ResumeSubscriptionCommand } from './resume-subscription.command';

@Injectable()
export class ResumeSubscriptionHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.WorkspaceSubscriptionRepository)
    private readonly subscriptionRepository: WorkspaceSubscriptionRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: ResumeSubscriptionCommand): Promise<void> {
    await this.unitOfWork.runInTransaction(async (context) => {
      const found = await this.subscriptionRepository.findByWorkspaceId(
        command.workspaceId,
        context,
      );
      const subscription = found
        ? await this.subscriptionRepository.findByIdForUpdate(
            found.getId(),
            context,
          )
        : null;
      const now = new Date();
      const periodEnd = subscription?.getCurrentPeriodEnd();

      if (
        !subscription?.getCancelAtPeriodEnd() ||
        subscription.getStatus() !== SubscriptionStatus.ACTIVE ||
        !periodEnd ||
        periodEnd.getTime() <= now.getTime()
      ) {
        throw new BadRequestException(
          'Only a subscription scheduled for cancellation within its period can be resumed',
        );
      }

      subscription.resume(command.userId, now);
      await this.subscriptionRepository.save(subscription, context);
    });
  }
}
