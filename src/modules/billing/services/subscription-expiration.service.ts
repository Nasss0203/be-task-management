import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { AdminSubscriptionGrantService } from './admin/admin-subscription-grant.service';

const EXPIRATION_SWEEP_INTERVAL_MS = 60_000;

@Injectable()
export class SubscriptionExpirationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SubscriptionExpirationService.name);
  private interval: NodeJS.Timeout | null = null;
  private sweepInProgress = false;

  constructor(
    private readonly adminSubscriptionService: AdminSubscriptionGrantService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.sweep();

    this.interval = setInterval(() => {
      void this.sweep();
    }, EXPIRATION_SWEEP_INTERVAL_MS);
    this.interval.unref();
  }

  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async sweep(): Promise<void> {
    if (this.sweepInProgress) {
      return;
    }

    this.sweepInProgress = true;

    try {
      const result =
        await this.adminSubscriptionService.expireDueSubscriptions();

      if (result.expiredSubscriptionIds.length > 0) {
        this.logger.log(
          `Expired ${result.expiredSubscriptionIds.length} subscription(s) and downgraded ${result.affectedWorkspaceIds.length} workspace(s)`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Subscription expiration sweep failed: ${message}`);
    } finally {
      this.sweepInProgress = false;
    }
  }
}
