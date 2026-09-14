import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { BILLING_TYPES } from '../../../../billing.types';
import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { BillingWebhookEvent } from '../../../../domain/entities/billing-webhook-event.entity';
import type { BillingWebhookEventRepository } from '../../../../domain/repositories/billing-webhook-event.repository';
import { BillingPaymentSettlementService } from '../../../services/billing-payment-settlement.service';
import { ProcessSepayPgIpnCommand } from './process-sepay-pg-ipn.command';

const ORDER_CODE_PATTERN = /^TM[A-F0-9]{32}$/;

const ACCEPTED_PAYMENT_METHODS = new Set([
  'CARD',
  'BANK_TRANSFER',
  'NAPAS_BANK_TRANSFER',
]);

const SUCCESS_NOTIFICATION_TYPES = new Set(['ORDER_PAID', 'PAYMENT_SUCCESS']);

@Injectable()
export class ProcessSepayPgIpnHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.BillingWebhookEventRepository)
    private readonly webhookEventRepository: BillingWebhookEventRepository,

    @Inject(BILLING_TYPES.services.BillingPaymentSettlementService)
    private readonly paymentSettlementService: BillingPaymentSettlementService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: ProcessSepayPgIpnCommand): Promise<void> {
    await this.unitOfWork.runInTransaction(async (context) => {
      const payload = command.payload;
      const processedAt = new Date();

      const notificationType = this.normalizeString(
        payload.notification_type,
      )?.toUpperCase();

      const transactionId = this.normalizeString(payload.transaction?.id);

      if (!notificationType || !transactionId) {
        throw new BadRequestException(
          'Invalid SePay Payment Gateway IPN payload',
        );
      }

      const webhookEvent = BillingWebhookEvent.create({
        provider: BillingProvider.SEPAY,
        providerEventId: `PG:${notificationType}:${transactionId}`,
        eventType: `PAYMENT_GATEWAY_${notificationType}`,
        payload: { ...payload },
        createdAt: processedAt,
      });

      const inserted = await this.webhookEventRepository.insertIfAbsent(
        webhookEvent,
        context,
      );

      // IPN đã được xử lý trước đó.
      if (!inserted) {
        return;
      }

      if (!SUCCESS_NOTIFICATION_TYPES.has(notificationType)) {
        await this.ignoreWebhook(webhookEvent, processedAt, context);
        return;
      }

      const orderCode = this.normalizeString(
        payload.order?.order_invoice_number,
      )?.toUpperCase();

      const orderStatus = this.normalizeString(
        payload.order?.order_status,
      )?.toUpperCase();

      const orderCurrency = this.normalizeString(
        payload.order?.order_currency,
      )?.toUpperCase();

      const transactionType = this.normalizeString(
        payload.transaction?.transaction_type,
      )?.toUpperCase();

      const transactionStatus = this.normalizeString(
        payload.transaction?.transaction_status,
      )?.toUpperCase();

      const transactionCurrency = this.normalizeString(
        payload.transaction?.transaction_currency,
      )?.toUpperCase();

      const paymentMethod = this.normalizeString(
        payload.transaction?.payment_method,
      )?.toUpperCase();

      const orderAmount = this.parseVndAmount(payload.order?.order_amount);

      const transactionAmount = this.parseVndAmount(
        payload.transaction?.transaction_amount,
      );

      const transactionAt = this.parseTransactionDate(
        payload.transaction?.transaction_date,
      );

      const isValidPayment =
        Boolean(orderCode && ORDER_CODE_PATTERN.test(orderCode)) &&
        orderStatus === 'CAPTURED' &&
        orderCurrency === 'VND' &&
        transactionType === 'PAYMENT' &&
        transactionStatus === 'APPROVED' &&
        transactionCurrency === 'VND' &&
        Boolean(paymentMethod && ACCEPTED_PAYMENT_METHODS.has(paymentMethod)) &&
        orderAmount !== null &&
        transactionAmount !== null &&
        orderAmount === transactionAmount &&
        transactionAt !== null;

      if (!isValidPayment || !orderCode || transactionAmount === null) {
        await this.ignoreWebhook(webhookEvent, processedAt, context);
        return;
      }

      const settlementResult = await this.paymentSettlementService.settle({
        orderCode,
        provider: BillingProvider.SEPAY,
        amount: transactionAmount,
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

  private normalizeString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private parseVndAmount(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return null;
    }

    const normalized = String(value).trim();

    if (!/^\d+(?:\.0+)?$/.test(normalized)) {
      return null;
    }

    const amount = Number(normalized);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return null;
    }

    return amount;
  }

  private parseTransactionDate(value: unknown): Date | null {
    if (typeof value !== 'string') {
      return null;
    }

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
