import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { BILLING_TYPES } from '../../../../billing.types';
import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { BillingWebhookEvent } from '../../../../domain/entities/billing-webhook-event.entity';
import type { BillingWebhookEventRepository } from '../../../../domain/repositories/billing-webhook-event.repository';
import type { PaymentOrderRepository } from '../../../../domain/repositories/payment-order.repository';
import { BillingPaymentSettlementService } from '../../../services/billing-payment-settlement.service';
import { ProcessStripeWebhookCommand } from './process-stripe-webhook.command';

@Injectable()
export class ProcessStripeWebhookHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.BillingWebhookEventRepository)
    private readonly webhookEventRepository: BillingWebhookEventRepository,

    @Inject(BILLING_TYPES.repositories.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,

    @Inject(BILLING_TYPES.services.BillingPaymentSettlementService)
    private readonly settlementService: BillingPaymentSettlementService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: ProcessStripeWebhookCommand): Promise<void> {
    const event = command.event;

    if (event.livemode !== false) {
      throw new BadRequestException('Only Stripe sandbox events are allowed');
    }

    await this.unitOfWork.runInTransaction(async (context) => {
      const processedAt = new Date();

      const webhookEvent = BillingWebhookEvent.create({
        provider: BillingProvider.STRIPE,
        providerEventId: event.id,
        eventType: event.type,
        payload: { ...event },
        createdAt: processedAt,
      });

      const inserted = await this.webhookEventRepository.insertIfAbsent(
        webhookEvent,
        context,
      );

      // Stripe có thể gửi lại cùng một event nhiều lần.
      if (!inserted) {
        return;
      }

      // Mặc định là IGNORED. Chỉ đổi sang PROCESSED khi xử lý thành công.
      webhookEvent.markIgnored(processedAt);

      /*
       * checkout.session.expired
       * Chỉ chuyển đơn PENDING thành EXPIRED.
       * Không thay đổi subscription.
       */
      if (event.type === 'checkout.session.expired') {
        const session = event.data.object;
        const metadata = session.metadata;

        const orderCode = metadata?.orderCode;
        const paymentOrderId = metadata?.paymentOrderId;
        const workspaceId = metadata?.workspaceId;
        const amount = session.amount_total;

        const isValidExpiredSession =
          session.livemode === false &&
          session.mode === 'payment' &&
          session.status === 'expired' &&
          session.payment_status === 'unpaid' &&
          session.payment_method_types.includes('card') &&
          Boolean(orderCode) &&
          Boolean(paymentOrderId) &&
          Boolean(workspaceId) &&
          /^TM[A-F0-9]{32}$/.test(orderCode ?? '') &&
          session.client_reference_id === paymentOrderId &&
          session.currency === 'vnd' &&
          typeof amount === 'number' &&
          Number.isSafeInteger(amount) &&
          amount > 0 &&
          Number.isSafeInteger(event.created) &&
          event.created > 0;

        if (!isValidExpiredSession) {
          await this.webhookEventRepository.save(webhookEvent, context);
          return;
        }

        const paymentOrder =
          await this.paymentOrderRepository.findByOrderCodeForUpdate(
            orderCode!,
            context,
          );

        const isMatchingOrder =
          paymentOrder &&
          paymentOrder.getId() === paymentOrderId &&
          paymentOrder.getWorkspaceId() === workspaceId &&
          paymentOrder.getProvider() === BillingProvider.STRIPE &&
          paymentOrder.getAmount() === amount &&
          paymentOrder.getCurrency() === 'VND';

        if (!isMatchingOrder) {
          await this.webhookEventRepository.save(webhookEvent, context);
          return;
        }

        /*
         * Nếu đơn đã PAID, FAILED, CANCELED hoặc EXPIRED thì bỏ qua.
         * Đặc biệt không được đổi ngược PAID thành EXPIRED.
         */
        if (!paymentOrder.isPending()) {
          await this.webhookEventRepository.save(webhookEvent, context);
          return;
        }

        const expiredAt = new Date(event.created * 1000);

        paymentOrder.markExpired(expiredAt);

        await this.paymentOrderRepository.save(paymentOrder, context);

        webhookEvent.markProcessed(processedAt);

        await this.webhookEventRepository.save(webhookEvent, context);

        return;
      }

      /*
       * Những event chưa được hỗ trợ sẽ được lưu là IGNORED.
       */
      if (event.type !== 'checkout.session.completed') {
        await this.webhookEventRepository.save(webhookEvent, context);
        return;
      }

      /*
       * checkout.session.completed
       */
      const session = event.data.object;
      const metadata = session.metadata;

      const orderCode = metadata?.orderCode;
      const paymentOrderId = metadata?.paymentOrderId;
      const workspaceId = metadata?.workspaceId;
      const amount = session.amount_total;

      const isValidCompletedSession =
        session.livemode === false &&
        session.mode === 'payment' &&
        session.status === 'complete' &&
        session.payment_status === 'paid' &&
        session.payment_method_types.includes('card') &&
        Boolean(session.payment_intent) &&
        Boolean(orderCode) &&
        Boolean(paymentOrderId) &&
        Boolean(workspaceId) &&
        /^TM[A-F0-9]{32}$/.test(orderCode ?? '') &&
        session.client_reference_id === paymentOrderId &&
        session.currency === 'vnd' &&
        typeof amount === 'number' &&
        Number.isSafeInteger(amount) &&
        amount > 0 &&
        Number.isSafeInteger(event.created) &&
        event.created > 0;

      if (!isValidCompletedSession) {
        await this.webhookEventRepository.save(webhookEvent, context);
        return;
      }

      const paymentOrder =
        await this.paymentOrderRepository.findByOrderCodeForUpdate(
          orderCode!,
          context,
        );

      const isMatchingOrder =
        paymentOrder &&
        paymentOrder.getId() === paymentOrderId &&
        paymentOrder.getWorkspaceId() === workspaceId &&
        paymentOrder.getProvider() === BillingProvider.STRIPE &&
        paymentOrder.getAmount() === amount &&
        paymentOrder.getCurrency() === 'VND';

      if (!isMatchingOrder) {
        await this.webhookEventRepository.save(webhookEvent, context);
        return;
      }

      const paidAt = new Date(event.created * 1000);

      const result = await this.settlementService.settle({
        orderCode: orderCode!,
        provider: BillingProvider.STRIPE,
        amount,
        currency: 'VND',
        paidAt,
        processedAt,
        context,
      });

      if (result === 'PROCESSED') {
        webhookEvent.markProcessed(processedAt);
      }

      await this.webhookEventRepository.save(webhookEvent, context);
    });
  }
}
