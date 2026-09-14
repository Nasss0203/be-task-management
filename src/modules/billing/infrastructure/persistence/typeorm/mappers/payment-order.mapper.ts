import { PaymentOrder } from '../../../../domain/entities/payment-order.entity';
import { PaymentOrderOrmEntity } from '../entities/payment-order.orm-entity';

export class PaymentOrderMapper {
  static toDomain(entity: PaymentOrderOrmEntity): PaymentOrder {
    const amount = Number(entity.amount);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error(`Invalid payment order amount: ${entity.amount}`);
    }

    return PaymentOrder.reconstitute({
      id: entity.id,
      workspaceId: entity.workspace_id,
      subscriptionId: entity.subscription_id ?? null,
      planPriceId: entity.plan_price_id,
      provider: entity.provider,
      orderCode: entity.order_code,
      amount,
      currency: entity.currency,
      status: entity.status,
      expiresAt: entity.expires_at ?? null,
      paidAt: entity.paid_at ?? null,
      createdBy: entity.created_by,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }

  static toOrm(paymentOrder: PaymentOrder): PaymentOrderOrmEntity {
    const amount = paymentOrder.getAmount();

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error(`Invalid payment order amount: ${amount}`);
    }

    const entity = new PaymentOrderOrmEntity();

    entity.id = paymentOrder.getId();
    entity.workspace_id = paymentOrder.getWorkspaceId();
    entity.subscription_id = paymentOrder.getSubscriptionId();
    entity.plan_price_id = paymentOrder.getPlanPriceId();
    entity.provider = paymentOrder.getProvider();
    entity.order_code = paymentOrder.getOrderCode();
    entity.amount = amount.toString();
    entity.currency = paymentOrder.getCurrency();
    entity.status = paymentOrder.getStatus();
    entity.expires_at = paymentOrder.getExpiresAt();
    entity.paid_at = paymentOrder.getPaidAt();
    entity.created_by = paymentOrder.getCreatedBy();
    entity.created_at = paymentOrder.getCreatedAt();
    entity.updated_at = paymentOrder.getUpdatedAt();

    return entity;
  }
}
