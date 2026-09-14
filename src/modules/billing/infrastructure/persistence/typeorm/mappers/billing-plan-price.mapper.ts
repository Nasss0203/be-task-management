import { BillingPlanPrice } from '../../../../domain/entities/billing-plan-price.entity';
import { BillingPlanPriceOrmEntity } from '../entities/billing-plan-price.orm-entity';

export class BillingPlanPriceMapper {
  static toDomain(entity: BillingPlanPriceOrmEntity): BillingPlanPrice {
    const amount = Number(entity.amount);

    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new Error(`Invalid billing plan price amount: ${entity.amount}`);
    }

    return BillingPlanPrice.reconstitute({
      id: entity.id,
      planId: entity.plan_id,
      billingInterval: entity.billing_interval,
      currency: entity.currency,
      amount,
      provider: entity.provider,
      providerPriceId: entity.provider_price_id ?? null,
      isActive: entity.is_active,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }

  static toOrm(planPrice: BillingPlanPrice): BillingPlanPriceOrmEntity {
    const amount = planPrice.getAmount();

    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new Error(`Invalid billing plan price amount: ${amount}`);
    }

    const entity = new BillingPlanPriceOrmEntity();

    entity.id = planPrice.getId();
    entity.plan_id = planPrice.getPlanId();
    entity.billing_interval = planPrice.getBillingInterval();
    entity.currency = planPrice.getCurrency();
    entity.amount = amount.toString();
    entity.provider = planPrice.getProvider();
    entity.provider_price_id = planPrice.getProviderPriceId();
    entity.is_active = planPrice.getIsActive();
    entity.created_at = planPrice.getCreatedAt();
    entity.updated_at = planPrice.getUpdatedAt();

    return entity;
  }
}
