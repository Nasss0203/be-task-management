import {
  TemplatePurchaseAggregate,
  TemplatePurchaseStatus,
} from '../../../domain/aggregates/template-purchase/template-purchase.aggregate';

export class CreateTemplatePurchaseResponseDto {
  id: string;
  orderCode: string;
  templateId: string;
  listingId: string;
  publishedVersionId: string;
  amount: number;
  currency: string;
  status: TemplatePurchaseStatus;
  expiresAt: Date;
  createdAt: Date;

  static fromDomain(
    purchase: TemplatePurchaseAggregate,
  ): CreateTemplatePurchaseResponseDto {
    const dto = new CreateTemplatePurchaseResponseDto();

    dto.id = purchase.getId();
    dto.orderCode = purchase.getOrderCode();
    dto.templateId = purchase.getTemplateId();
    dto.listingId = purchase.getListingId();
    dto.publishedVersionId = purchase.getPublishedVersionId();
    dto.amount = purchase.getAmount();
    dto.currency = purchase.getCurrency();
    dto.status = purchase.getStatus();
    dto.expiresAt = purchase.getExpiresAt();
    dto.createdAt = purchase.getCreatedAt();

    return dto;
  }
}
