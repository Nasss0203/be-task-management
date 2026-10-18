import type {
  FindPurchaseHistoryFilters,
  FindPurchaseHistoryResult,
} from './template-purchase-history.read-model';
import { TemplatePurchaseStatus } from '../aggregates/template-purchase/template-purchase.aggregate';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { TemplatePurchase } from '../aggregates/template-purchase/template-purchase.aggregate';

export interface TemplatePurchaseRepository {
  create(
    purchase: TemplatePurchase,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase>;

  save(
    purchase: TemplatePurchase,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase | null>;

  findByOrderCode(
    orderCode: string,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase | null>;

  findByBuyerAndIdempotencyKey(
    buyerId: string,
    idempotencyKey: string,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase | null>;

  findByIdForUpdate(
    id: string,
    context: PersistenceContext,
  ): Promise<TemplatePurchase | null>;

  findByOrderCodeForUpdate(
    orderCode: string,
    context: PersistenceContext,
  ): Promise<TemplatePurchase | null>;

  /** The buyer's purchases, newest first (keyset cursor). Read-only. */
  findHistoryByBuyer(
    filters: FindPurchaseHistoryFilters,
    context?: PersistenceContext,
  ): Promise<FindPurchaseHistoryResult>;

  existsByBuyerTemplateAndStatus(
    buyerId: string,
    templateId: string,
    status: TemplatePurchaseStatus,
    context?: PersistenceContext,
  ): Promise<boolean>;
}
