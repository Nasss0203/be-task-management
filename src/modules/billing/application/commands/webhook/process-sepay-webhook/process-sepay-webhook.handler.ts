import { Inject, Injectable } from '@nestjs/common';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { BILLING_TYPES } from '../../../../billing.types';
import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { BillingWebhookEvent } from '../../../../domain/entities/billing-webhook-event.entity';
import type { BillingWebhookEventRepository } from '../../../../domain/repositories/billing-webhook-event.repository';
import { BillingPaymentSettlementService } from '../../../services/billing-payment-settlement.service';
import { ProcessSepayWebhookCommand } from './process-sepay-webhook.command';

const SEPAY_TRANSACTION_EVENT = 'BANK_TRANSACTION';
const ORDER_CODE_PATTERN = /TM[A-F0-9]{32}/;

@Injectable()
export class ProcessSepayWebhookHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.BillingWebhookEventRepository)
    private readonly webhookEventRepository: BillingWebhookEventRepository,

    @Inject(BILLING_TYPES.services.BillingPaymentSettlementService)
    private readonly paymentSettlementService: BillingPaymentSettlementService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: ProcessSepayWebhookCommand): Promise<void> {
    await this.unitOfWork.runInTransaction(async (context) => {
      const payload = command.payload;
      const processedAt = new Date();

      const webhookEvent = BillingWebhookEvent.create({
        provider: BillingProvider.SEPAY,
        providerEventId: payload.id.toString(),
        eventType: SEPAY_TRANSACTION_EVENT,
        payload: { ...payload },
        createdAt: processedAt,
      });

      const inserted = await this.webhookEventRepository.insertIfAbsent(
        webhookEvent,
        context,
      );

      if (!inserted) {
        return;
      }

      if (payload.transferType !== 'in') {
        await this.ignoreWebhook(webhookEvent, processedAt, context);
        return;
      }

      const orderCode = this.extractOrderCode(
        payload.code ?? null,
        payload.content,
      );

      if (!orderCode) {
        await this.ignoreWebhook(webhookEvent, processedAt, context);
        return;
      }

      const transactionAt = this.parseTransactionDate(payload.transactionDate);

      if (!transactionAt) {
        await this.ignoreWebhook(webhookEvent, processedAt, context);
        return;
      }

      const settlementResult = await this.paymentSettlementService.settle({
        orderCode,
        provider: BillingProvider.SEPAY,
        amount: payload.transferAmount,
        currency: 'VND',
        paidAt: transactionAt,
        processedAt,
        context,
      });

      if (settlementResult === 'PROCESSED') {
        webhookEvent.markProcessed(processedAt);
      } else {
        webhookEvent.markIgnored(processedAt);
      }

      await this.webhookEventRepository.save(webhookEvent, context);
    });
  }

  private extractOrderCode(
    code: string | null,
    content: string,
  ): string | null {
    const normalizedCode = code?.trim().toUpperCase() ?? '';

    if (
      normalizedCode.length === 34 &&
      ORDER_CODE_PATTERN.test(normalizedCode)
    ) {
      return normalizedCode;
    }

    const contentMatch = content.toUpperCase().match(ORDER_CODE_PATTERN);

    return contentMatch?.[0] ?? null;
  }

  private parseTransactionDate(value: string): Date | null {
    const normalized = value.trim();

    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
      return null;
    }

    const parsed = new Date(`${normalized.replace(' ', 'T')}+07:00`);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private async ignoreWebhook(
    webhookEvent: BillingWebhookEvent,
    processedAt: Date,
    context: PersistenceContext,
  ): Promise<void> {
    webhookEvent.markIgnored(processedAt);

    await this.webhookEventRepository.save(webhookEvent, context);
  }
}
