import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { BILLING_TYPES } from '../../../../billing.types';
import { SubscriptionStatus } from '../../../../domain/constants/subscription-status.constant';
import type { WorkspaceSubscriptionRepository } from '../../../../domain/repositories/workspace-subscription.repository';
import { CancelSubscriptionCommand } from './cancel-subscription.command';

@Injectable()
export class CancelSubscriptionHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.WorkspaceSubscriptionRepository)
    private readonly subscriptionRepository: WorkspaceSubscriptionRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: CancelSubscriptionCommand): Promise<void> {
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

      if (
        !subscription?.isPaid() ||
        subscription.getStatus() !== SubscriptionStatus.ACTIVE
      ) {
        throw new BadRequestException(
          'Only an active paid subscription can be canceled',
        );
      }

      if (subscription.getCancelAtPeriodEnd()) {
        return;
      }

      subscription.scheduleCancellation();
      await this.subscriptionRepository.save(subscription, context);
    });
  }
}
