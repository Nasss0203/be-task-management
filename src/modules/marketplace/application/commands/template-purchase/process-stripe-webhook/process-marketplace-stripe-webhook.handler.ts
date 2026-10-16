import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type Stripe from 'stripe';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import {
  TemplatePurchaseProvider,
  TemplatePurchaseStatus,
} from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';
import { MarketplaceWebhookEvent } from '../../../../domain/entities/marketplace-webhook-event.entity';
import type { MarketplaceWebhookEventRepository } from '../../../../domain/repositories/marketplace-webhook-event.repository';
import type { TemplatePurchaseRepository } from '../../../../domain/repositories/template-purchase.repository';
import { MARKETPLACE_TYPES } from '../../../../marketplace.types';
import { TemplatePurchaseSettlementService } from '../../../services/template-purchase-settlement.service';
import { ProcessMarketplaceStripeWebhookCommand } from './process-marketplace-stripe-webhook.command';

@Injectable()
export class ProcessMarketplaceStripeWebhookHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.services.TemplatePurchaseSettlementService)
    private readonly settlementService: TemplatePurchaseSettlementService,

    @Inject(MARKETPLACE_TYPES.repositories.TemplatePurchaseRepository)
    private readonly purchaseRepository: TemplatePurchaseRepository,

    @Inject(MARKETPLACE_TYPES.repositories.MarketplaceWebhookEventRepository)
    private readonly webhookEventRepository: MarketplaceWebhookEventRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: ProcessMarketplaceStripeWebhookCommand,
  ): Promise<void> {
    const event = command.event;

    if (event.livemode !== false) {
      throw new BadRequestException('Only Stripe test events are allowed');
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session?.metadata;

    // Không xử lý giao dịch không thuộc Marketplace Template Purchase.
    if (metadata?.purpose !== 'MARKETPLACE_TEMPLATE_PURCHASE') {
      return;
    }

    const purchaseId = metadata.purchaseId;
    const templateId = metadata.templateId;
    const orderCode = metadata.orderCode;

    await this.unitOfWork.runInTransaction(async (context) => {
      const processedAt = new Date();

      // 1. Idempotency: Lưu event ID vào marketplace_webhook_events
      const webhookEvent = MarketplaceWebhookEvent.create({
        provider: TemplatePurchaseProvider.STRIPE,
        providerEventId: event.id,
        eventType: event.type,
        payload: {
          id: event.id,
          type: event.type,
          created: event.created,
          sessionId: session.id,
          status: session.status,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          currency: session.currency,
          clientReferenceId: session.client_reference_id,
          orderCode,
          purchaseId,
          templateId,
        },
        createdAt: processedAt,
      });

      const inserted = await this.webhookEventRepository.insertIfAbsent(
        webhookEvent,
        context,
      );

      if (!inserted) {
        return;
      }

      webhookEvent.markIgnored(processedAt);

      // 2. Xử lý sự kiện checkout.session.expired
      if (event.type === 'checkout.session.expired') {
        const isValidExpired =
          session.livemode === false &&
          session.mode === 'payment' &&
          session.status === 'expired' &&
          session.payment_status === 'unpaid' &&
          Boolean(purchaseId) &&
          Boolean(orderCode) &&
          /^TP[A-F0-9]{32}$/.test(orderCode ?? '') &&
          session.client_reference_id === purchaseId;

        if (!isValidExpired) {
          await this.webhookEventRepository.save(webhookEvent, context);
          return;
        }

        const purchase =
          await this.purchaseRepository.findByOrderCodeForUpdate(
            orderCode!,
            context,
          );

        if (!purchase || purchase.getId() !== purchaseId) {
          await this.webhookEventRepository.save(webhookEvent, context);
          return;
        }

        if (purchase.getStatus() !== TemplatePurchaseStatus.PENDING) {
          await this.webhookEventRepository.save(webhookEvent, context);
          return;
        }

        if (Date.now() >= purchase.getExpiresAt().getTime()) {
          purchase.expire();
          await this.purchaseRepository.save(purchase, context);
          webhookEvent.markProcessed(processedAt);
        }

        await this.webhookEventRepository.save(webhookEvent, context);
        return;
      }

      // 3. Xử lý sự kiện checkout.session.completed
      if (event.type !== 'checkout.session.completed') {
        await this.webhookEventRepository.save(webhookEvent, context);
        return;
      }

      const amount = session.amount_total;

      const isValidCompleted =
        session.livemode === false &&
        session.mode === 'payment' &&
        session.status === 'complete' &&
        session.payment_status === 'paid' &&
        session.payment_method_types?.includes('card') === true &&
        Boolean(session.payment_intent) &&
        Boolean(purchaseId) &&
        Boolean(templateId) &&
        Boolean(orderCode) &&
        /^TP[A-F0-9]{32}$/.test(orderCode ?? '') &&
        session.client_reference_id === purchaseId &&
        session.currency === 'vnd' &&
        typeof amount === 'number' &&
        Number.isSafeInteger(amount) &&
        amount > 0 &&
        Number.isSafeInteger(event.created) &&
        event.created > 0;

      if (!isValidCompleted) {
        webhookEvent.markReconciliationRequired(processedAt);
        await this.webhookEventRepository.save(webhookEvent, context);
        return;
      }

      const paidAt = new Date(event.created * 1000);

      const result = await this.settlementService.settle({
        purchaseId: purchaseId!,
        templateId: templateId!,
        orderCode: orderCode!,
        provider: TemplatePurchaseProvider.STRIPE,
        amount: amount!,
        currency: 'VND',
        paidAt,
        processedAt,
        context,
      });

      if (result === 'PROCESSED') {
        webhookEvent.markProcessed(processedAt);
      } else if (result === 'RECONCILIATION_REQUIRED') {
        webhookEvent.markReconciliationRequired(processedAt);
      }

      await this.webhookEventRepository.save(webhookEvent, context);
    });
  }
}
