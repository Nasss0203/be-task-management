import { TemplatePurchase } from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';
import { TemplatePurchaseOrmEntity } from '../entities/template-purchase.orm-entity';

export class TemplatePurchaseMapper {
  static toDomain(entity: TemplatePurchaseOrmEntity): TemplatePurchase {
    const amount = Number(entity.amount);

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      BigInt(amount) !== BigInt(entity.amount)
    ) {
      throw new Error('Invalid template purchase amount');
    }

    const platformFeeAmount = Number(entity.platformFeeAmount);

    if (
      !Number.isSafeInteger(platformFeeAmount) ||
      platformFeeAmount < 0 ||
      platformFeeAmount > amount
    ) {
      throw new Error('Invalid template purchase platform fee amount');
    }

    return TemplatePurchase.restore({
      id: entity.id,
      orderCode: entity.orderCode,
      templateId: entity.templateId,
      listingId: entity.listingId,
      buyerId: entity.buyerId,
      publishedVersionId: entity.publishedVersionId,
      amount,
      currency: entity.currency,
      commissionRateBps: entity.commissionRateBps,
      platformFeeAmount,
      idempotencyKey: entity.idempotencyKey,
      expiresAt: entity.expiresAt,
      status: entity.status,
      provider: entity.provider,
      entitlementId: entity.entitlementId,
      paidAt: entity.paidAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(purchase: TemplatePurchase): TemplatePurchaseOrmEntity {
    const entity = new TemplatePurchaseOrmEntity();

    entity.id = purchase.getId();
    entity.orderCode = purchase.getOrderCode();
    entity.templateId = purchase.getTemplateId();
    entity.listingId = purchase.getListingId();
    entity.buyerId = purchase.getBuyerId();
    entity.publishedVersionId = purchase.getPublishedVersionId();

    // PostgreSQL bigint lưu dưới dạng string
    entity.amount = purchase.getAmount().toString();
    entity.currency = purchase.getCurrency();
    entity.commissionRateBps = purchase.getCommissionRateBps();
    entity.platformFeeAmount = purchase.getPlatformFeeAmount().toString();

    entity.idempotencyKey = purchase.getIdempotencyKey();
    entity.expiresAt = purchase.getExpiresAt();
    entity.status = purchase.getStatus();
    entity.provider = purchase.getProvider();
    entity.entitlementId = purchase.getEntitlementId();
    entity.paidAt = purchase.getPaidAt();

    entity.createdAt = purchase.getCreatedAt();
    entity.updatedAt = purchase.getUpdatedAt();

    return entity;
  }
}
