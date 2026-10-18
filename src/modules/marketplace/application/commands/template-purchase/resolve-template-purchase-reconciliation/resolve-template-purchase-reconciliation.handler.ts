import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { TemplateEntitlement } from '../../../../domain/aggregates/template-entitlement/template-entitlement.aggregate';
import { TemplatePurchaseStatus } from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';
import { TemplateEntitlementSource } from '../../../../domain/enums/template-entitlement-source.enum';
import type { TemplateEntitlementRepository } from '../../../../domain/repositories/template-entitlement.repository';
import type { TemplatePurchaseRepository } from '../../../../domain/repositories/template-purchase.repository';
import {
  ResolveTemplatePurchaseReconciliationCommand,
  TemplatePurchaseReconciliationResolution,
} from './resolve-template-purchase-reconciliation.command';

export interface ResolveTemplatePurchaseReconciliationResult {
  purchaseId: string;
  status: TemplatePurchaseStatus;
  entitlementId: string | null;
}

/**
 * Closes a RECONCILIATION_REQUIRED purchase after an admin checked the
 * payment at the provider. Once closed, the buyer can purchase again.
 */
@Injectable()
export class ResolveTemplatePurchaseReconciliationHandler {
  private readonly logger = new Logger(
    ResolveTemplatePurchaseReconciliationHandler.name,
  );

  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplatePurchaseRepository)
    private readonly purchaseRepository: TemplatePurchaseRepository,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateEntitlementRepository)
    private readonly entitlementRepository: TemplateEntitlementRepository,

    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templateRepository: TemplateContentPort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: ResolveTemplatePurchaseReconciliationCommand,
  ): Promise<ResolveTemplatePurchaseReconciliationResult> {
    const purchase = await this.unitOfWork.runInTransaction(async (context) => {
      // Same lock order as settlement: template row, then entitlement.
      const current = await this.purchaseRepository.findById(
        command.purchaseId,
        context,
      );

      if (!current) {
        throw new NotFoundException('Template purchase not found');
      }

      await this.templateRepository.findByIdForUpdate(
        current.getTemplateId(),
        context,
      );

      const locked = await this.purchaseRepository.findByIdForUpdate(
        command.purchaseId,
        context,
      );

      if (
        !locked ||
        locked.getStatus() !== TemplatePurchaseStatus.RECONCILIATION_REQUIRED
      ) {
        throw new ConflictException(
          'Template purchase is not awaiting reconciliation',
        );
      }

      if (command.resolution === TemplatePurchaseReconciliationResolution.REFUND) {
        locked.resolveReconciliationAsRefunded();
      } else {
        locked.resolveReconciliationAsPaid(
          await this.grantPaidEntitlement(
            locked.getTemplateId(),
            locked.getBuyerId(),
            context,
          ),
          new Date(),
        );
      }

      return this.purchaseRepository.save(locked, context);
    });

    this.logger.log(
      `Purchase ${purchase.getId()} reconciled as ${command.resolution} by ${command.resolvedBy}`,
    );

    return {
      purchaseId: purchase.getId(),
      status: purchase.getStatus(),
      entitlementId: purchase.getEntitlementId(),
    };
  }

  private async grantPaidEntitlement(
    templateId: string,
    buyerId: string,
    context: PersistenceContext,
  ): Promise<string> {
    const existing = await this.entitlementRepository.findByTemplateAndUser(
      templateId,
      buyerId,
      context,
    );

    if (existing?.getSource() === TemplateEntitlementSource.PAID_PURCHASE) {
      // Granting again would double-sell; this payment must be refunded.
      throw new ConflictException(
        'Buyer already owns this template; resolve this payment as REFUND',
      );
    }

    if (existing) {
      await this.entitlementRepository.upgradeFreeClaimToPaidPurchase(
        existing.getId(),
        context,
      );

      return existing.getId();
    }

    const created = await this.entitlementRepository.create(
      TemplateEntitlement.create({
        templateId,
        userId: buyerId,
        source: TemplateEntitlementSource.PAID_PURCHASE,
      }),
      context,
    );

    return created.getId();
  }
}
