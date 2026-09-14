import { WorkspaceSubscription } from '../../../../domain/entities/workspace-subscription.entity';
import { WorkspaceSubscriptionOrmEntity } from '../entities/workspace-subscription.orm-entity';

export class WorkspaceSubscriptionMapper {
  static toDomain(
    entity: WorkspaceSubscriptionOrmEntity,
  ): WorkspaceSubscription {
    return WorkspaceSubscription.reconstitute({
      id: entity.id,
      workspaceId: entity.workspace_id,
      planId: entity.plan_id,
      planPriceId: entity.plan_price_id ?? null,
      provider: entity.provider ?? null,
      status: entity.status,
      currentPeriodStart: entity.current_period_start ?? null,
      currentPeriodEnd: entity.current_period_end ?? null,
      cancelAtPeriodEnd: entity.cancel_at_period_end,
      canceledAt: entity.canceled_at ?? null,
      providerCustomerId: entity.provider_customer_id ?? null,
      providerSubscriptionId: entity.provider_subscription_id ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }

  static toOrm(
    subscription: WorkspaceSubscription,
  ): WorkspaceSubscriptionOrmEntity {
    const entity = new WorkspaceSubscriptionOrmEntity();

    entity.id = subscription.getId();
    entity.workspace_id = subscription.getWorkspaceId();
    entity.plan_id = subscription.getPlanId();
    entity.plan_price_id = subscription.getPlanPriceId();
    entity.provider = subscription.getProvider();
    entity.status = subscription.getStatus();
    entity.current_period_start = subscription.getCurrentPeriodStart();
    entity.current_period_end = subscription.getCurrentPeriodEnd();
    entity.cancel_at_period_end = subscription.getCancelAtPeriodEnd();
    entity.canceled_at = subscription.getCanceledAt();
    entity.provider_customer_id = subscription.getProviderCustomerId();
    entity.provider_subscription_id = subscription.getProviderSubscriptionId();
    entity.created_at = subscription.getCreatedAt();
    entity.updated_at = subscription.getUpdatedAt();

    return entity;
  }
}
