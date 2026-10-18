import type { TemplatePurchaseHistoryReadModel } from '../../../domain/repositories/template-purchase-history.read-model';

export class TemplatePurchaseHistoryItemDto {
  id: string;
  orderCode: string;
  templateId: string;
  templateName: string | null;
  templateIcon: string | null;
  versionNumber: number | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  paidAt: Date | null;

  static fromReadModel(
    row: TemplatePurchaseHistoryReadModel,
  ): TemplatePurchaseHistoryItemDto {
    return Object.assign(new TemplatePurchaseHistoryItemDto(), row);
  }
}

export interface TemplatePurchaseHistoryResponseDto {
  items: TemplatePurchaseHistoryItemDto[];
  nextCursor: string | null;
}
