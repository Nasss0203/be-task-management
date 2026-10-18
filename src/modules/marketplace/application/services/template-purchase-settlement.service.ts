import { Inject, Injectable, Logger } from '@nestjs/common';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import { MARKETPLACE_TYPES } from '../../marketplace.types';

import {
  TemplatePurchaseProvider,
  TemplatePurchaseStatus,
} from '../../domain/aggregates/template-purchase/template-purchase.aggregate';

import { TemplateEntitlement } from '../../domain/aggregates/template-entitlement/template-entitlement.aggregate';

import { TemplateEntitlementSource } from '../../domain/enums/template-entitlement-source.enum';

import type { TemplatePurchaseRepository } from '../../domain/repositories/template-purchase.repository';

import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import type { TemplateEntitlementRepository } from '../../domain/repositories/template-entitlement.repository';

export type TemplatePurchaseSettlementResult =
  | 'PROCESSED'
  | 'IGNORED'
  | 'RECONCILIATION_REQUIRED';

export interface SettleTemplatePurchaseInput {
  purchaseId: string;
  templateId: string;
  orderCode: string;
  provider: TemplatePurchaseProvider;
  amount: number;
  currency: string;
  paidAt: Date;
  processedAt: Date;
  context: PersistenceContext;
}

@Injectable()
export class TemplatePurchaseSettlementService {
  private readonly logger = new Logger(TemplatePurchaseSettlementService.name);

  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplatePurchaseRepository)
    private readonly purchaseRepository: TemplatePurchaseRepository,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateEntitlementRepository)
    private readonly entitlementRepository: TemplateEntitlementRepository,
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templateContentPort: TemplateContentPort,
  ) {}

  async settle(
    input: SettleTemplatePurchaseInput,
  ): Promise<TemplatePurchaseSettlementResult> {
    const purchase = await this.purchaseRepository.findByOrderCodeForUpdate(
      input.orderCode,
      input.context,
    );

    if (!purchase) {
      this.logger.error(
        `CRITICAL: Missing purchase for completed payment. OrderCode: ${input.orderCode}, PurchaseId: ${input.purchaseId}, TemplateId: ${input.templateId}, Amount: ${input.amount}, Provider: ${input.provider}`,
      );
      return 'RECONCILIATION_REQUIRED';
    }

    // Đối chiếu Purchase với thông tin giao dịch đã xác minh.
    if (
      purchase.getId() !== input.purchaseId ||
      purchase.getTemplateId() !== input.templateId
    ) {
      this.logger.error(
        `CRITICAL: Metadata mismatch for purchase ${purchase.getId()}: expected template ${purchase.getTemplateId()}, got ${input.templateId}; purchaseId in metadata ${input.purchaseId}`,
      );
      purchase.requireReconciliation();
      await this.purchaseRepository.save(purchase, input.context);

      return 'RECONCILIATION_REQUIRED';
    }

    // Webhook trùng: Purchase đã được xử lý.
    if (purchase.getStatus() === TemplatePurchaseStatus.PAID) {
      return 'IGNORED';
    }

    if (
      purchase.getStatus() === TemplatePurchaseStatus.RECONCILIATION_REQUIRED
    ) {
      return 'RECONCILIATION_REQUIRED';
    }

    const isMatchingPayment =
      purchase.getProvider() === input.provider &&
      purchase.getAmount() === input.amount &&
      purchase.getCurrency() === input.currency.trim().toUpperCase();

    // Đã có xác nhận thanh toán nhưng dữ liệu không khớp.
    if (!isMatchingPayment) {
      this.logger.error(
        `Payment mismatch for purchase ${purchase.getId()}: expected ${purchase.getAmount()} ${purchase.getCurrency()} via ${purchase.getProvider()}, got ${input.amount} ${input.currency} via ${input.provider}`,
      );
      purchase.requireReconciliation();
      await this.purchaseRepository.save(purchase, input.context);

      return 'RECONCILIATION_REQUIRED';
    }

    // Chỉ cấp Entitlement khi Purchase còn hợp lệ.
    const isValidPendingPurchase =
      purchase.getStatus() === TemplatePurchaseStatus.PENDING &&
      input.paidAt instanceof Date &&
      Number.isFinite(input.paidAt.getTime()) &&
      input.paidAt.getTime() < purchase.getExpiresAt().getTime();

    if (!isValidPendingPurchase) {
      this.logger.warn(
        `Purchase ${purchase.getId()} is not a valid pending purchase (status: ${purchase.getStatus()}, paidAt: ${input.paidAt?.toISOString()}, expiresAt: ${purchase.getExpiresAt()?.toISOString()})`,
      );
      purchase.requireReconciliation();
      await this.purchaseRepository.save(purchase, input.context);

      return 'RECONCILIATION_REQUIRED';
    }

    // 1. Serialize entitlement creation for the same template by locking template row FIRST.
    // FREE Claim also uses this template row lock.
    const lockedTemplate = await this.templateContentPort.findByIdForUpdate(
      purchase.getTemplateId(),
      input.context,
    );

    if (!lockedTemplate) {
      this.logger.error(
        `Template ${purchase.getTemplateId()} not found for purchase ${purchase.getId()}`,
      );
      purchase.requireReconciliation();
      await this.purchaseRepository.save(purchase, input.context);

      return 'RECONCILIATION_REQUIRED';
    }

    // 2. CHECK ENTITLEMENT ONLY AFTER ACQUIRING THE TEMPLATE LOCK
    // This guarantees that any concurrent transaction for the same user and template has already committed.
    const existingEntitlement =
      await this.entitlementRepository.findByTemplateAndUser(
        purchase.getTemplateId(),
        purchase.getBuyerId(),
        input.context,
      );

    // FREE_CLAIM -> PAID_PURCHASE trên cùng một dòng, giữ created_at để
    // biết user từng claim FREE (refund sau này chỉ hạ quyền, không xoá).
    if (
      existingEntitlement?.getSource() === TemplateEntitlementSource.FREE_CLAIM
    ) {
      const upgraded =
        await this.entitlementRepository.upgradeFreeClaimToPaidPurchase(
          existingEntitlement.getId(),
          input.context,
        );

      if (!upgraded) {
        this.logger.warn(
          `Entitlement ${existingEntitlement.getId()} changed during upgrade. Moving purchase ${purchase.getId()} to reconciliation.`,
        );
        purchase.requireReconciliation();
        await this.purchaseRepository.save(purchase, input.context);

        return 'RECONCILIATION_REQUIRED';
      }

      purchase.markPaid(existingEntitlement.getId(), input.paidAt);
      await this.purchaseRepository.save(purchase, input.context);

      return 'PROCESSED';
    }

    // Đã có PAID_PURCHASE từ giao dịch khác (hoặc giao dịch đồng thời vừa hoàn thành).
    // Không gán Entitlement đó cho Purchase hiện tại, chuyển sang đối soát.
    if (existingEntitlement) {
      this.logger.warn(
        `User ${purchase.getBuyerId()} already owns template ${purchase.getTemplateId()}. Moving purchase ${purchase.getId()} to reconciliation.`,
      );
      purchase.requireReconciliation();
      await this.purchaseRepository.save(purchase, input.context);

      return 'RECONCILIATION_REQUIRED';
    }

    try {
      const entitlement = TemplateEntitlement.create({
        templateId: purchase.getTemplateId(),
        userId: purchase.getBuyerId(),
        source: TemplateEntitlementSource.PAID_PURCHASE,
      });

      await this.entitlementRepository.create(entitlement, input.context);

      purchase.markPaid(entitlement.getId(), input.paidAt);

      await this.purchaseRepository.save(purchase, input.context);

      return 'PROCESSED';
    } catch (error) {
      const databaseError = error as {
        code?: string;
        constraint?: string;
        driverError?: { code?: string; constraint?: string };
      } | null;
      const constraintError = databaseError?.driverError ?? databaseError;

      if (
        constraintError?.code === '23505' &&
        constraintError.constraint === 'UQ_template_entitlements_template_user'
      ) {
        this.logger.warn(
          `Constraint violation 23505 caught for template ${purchase.getTemplateId()} and user ${purchase.getBuyerId()}. Moving purchase ${purchase.getId()} to reconciliation.`,
        );
        purchase.requireReconciliation();
        await this.purchaseRepository.save(purchase, input.context);

        return 'RECONCILIATION_REQUIRED';
      }

      throw error;
    }
  }
}
