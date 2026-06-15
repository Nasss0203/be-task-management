import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe = require('stripe');
import { Repository } from 'typeorm';

import {
  BillingWebhook,
  BillingWebhookStatus,
} from '../../domain/entities/billing-webhook.entity';
import { PaymentStatus } from '../../domain/entities/payment.entity';
import {
  BillingProvider,
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';
import { type PaymentRepository } from '../../interfaces/repositories/payment/payment.repository.interface';
import { type CompletePaymentService } from '../../interfaces/services/complete-payment/complete-payment.service.interface';
import { BILLING_TYPES } from '../../interfaces/types';

type StripeClient = InstanceType<typeof Stripe>;
type StripeEvent = ReturnType<StripeClient['webhooks']['constructEvent']>;
type StripeCheckoutSession = Extract<
  StripeEvent,
  { type: 'checkout.session.completed' }
>['data']['object'];
type StripeInvoice = Extract<
  StripeEvent,
  { type: 'invoice.paid' }
>['data']['object'];

@Injectable()
export class StripeWebhookService {
  private readonly stripe: StripeClient;

  constructor(
    private readonly configService: ConfigService,

    @Inject(BILLING_TYPES.repositories.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,

    @Inject(BILLING_TYPES.services.CompletePaymentService)
    private readonly completePaymentService: CompletePaymentService,

    @InjectRepository(BillingWebhook)
    private readonly webhookRepository: Repository<BillingWebhook>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  async handle(rawBody: Buffer, signature: string): Promise<void> {
    let event: StripeEvent;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const existing = await this.webhookRepository.findOne({
      where: {
        provider: BillingProvider.STRIPE,
        providerEventId: event.id,
      },
    });

    if (existing?.status === BillingWebhookStatus.PROCESSED) {
      return;
    }

    const webhook =
      existing ??
      this.webhookRepository.create({
        provider: BillingProvider.STRIPE,
        providerEventId: event.id,
        eventType: event.type,
        payload: event as unknown as Record<string, unknown>,
        status: BillingWebhookStatus.RECEIVED,
        userId: null,
        targetWorkspaceId: null,
        subscriptionId: null,
        paymentId: null,
        invoiceId: null,
        orderCode: null,
        providerTransactionId: null,
        processedAt: null,
        errorMessage: null,
      });

    await this.webhookRepository.save(webhook);

    try {
      await this.processEvent(event, webhook);
      if (webhook.status !== BillingWebhookStatus.IGNORED) {
        webhook.status = BillingWebhookStatus.PROCESSED;
      }
      webhook.processedAt = new Date();
      webhook.errorMessage = null;
      await this.webhookRepository.save(webhook);
    } catch (error) {
      webhook.status = BillingWebhookStatus.FAILED;
      webhook.errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.webhookRepository.save(webhook);
      throw error;
    }
  }

  async verifyCheckoutSession(sessionId: string, userId: string) {
    const payment =
      await this.paymentRepository.findPaymentByProviderOrderId(
        BillingProvider.STRIPE,
        sessionId,
      );

    if (!payment) {
      throw new BadRequestException('Stripe payment not found');
    }

    if (payment.userId !== userId) {
      throw new ForbiddenException('Stripe payment does not belong to user');
    }

    if (
      payment.status === PaymentStatus.SUCCEEDED &&
      payment.subscriptionId
    ) {
      return {
        completed: true,
        paymentId: payment.id,
        orderCode: payment.orderCode,
        provider: BillingProvider.STRIPE,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        stripeSessionStatus:
          typeof payment.metadata?.status === 'string'
            ? payment.metadata.status
            : 'complete',
        stripePaymentStatus:
          typeof payment.metadata?.paymentStatus === 'string'
            ? payment.metadata.paymentStatus
            : 'paid',
      };
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      await this.completeCheckout(session);
    }

    const updatedPayment =
      await this.paymentRepository.findPaymentByProviderOrderId(
        BillingProvider.STRIPE,
        sessionId,
      );

    return {
      completed: updatedPayment?.status === PaymentStatus.SUCCEEDED,
      paymentId: updatedPayment?.id ?? payment.id,
      orderCode: updatedPayment?.orderCode ?? payment.orderCode,
      provider: BillingProvider.STRIPE,
      amount: updatedPayment?.amount ?? payment.amount,
      currency: updatedPayment?.currency ?? payment.currency,
      status: updatedPayment?.status ?? payment.status,
      stripeSessionStatus: session.status,
      stripePaymentStatus: session.payment_status,
    };
  }

  private async processEvent(
    event: StripeEvent,
    webhook: BillingWebhook,
  ): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.completeCheckout(event.data.object, webhook);
        return;
      case 'checkout.session.expired':
        await this.failCheckout(event.data.object, webhook);
        return;
      case 'invoice.paid':
        await this.updateSubscriptionFromInvoice(
          event.data.object,
          SubscriptionStatus.ACTIVE,
        );
        return;
      case 'invoice.payment_failed':
        await this.updateSubscriptionFromInvoice(
          event.data.object,
          SubscriptionStatus.PAST_DUE,
        );
        return;
      case 'customer.subscription.deleted':
        await this.updateSubscriptionStatus(
          event.data.object.id,
          SubscriptionStatus.CANCELLED,
        );
        return;
      default:
        webhook.status = BillingWebhookStatus.IGNORED;
    }
  }

  private async completeCheckout(
    session: StripeCheckoutSession,
    webhook?: BillingWebhook,
  ): Promise<void> {
    const orderCode = session.metadata?.orderCode;

    if (!orderCode) {
      throw new BadRequestException('Stripe order code is missing');
    }

    const payment =
      await this.paymentRepository.findPaymentByOrderCode(orderCode);

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (webhook) {
      webhook.paymentId = payment.id;
      webhook.userId = payment.userId;
      webhook.targetWorkspaceId = payment.targetWorkspaceId;
      webhook.orderCode = payment.orderCode;
      webhook.providerTransactionId = this.getStripeId(session.payment_intent);
    }

    const metadata = await this.checkoutMetadata(session);

    if (payment.status === PaymentStatus.SUCCEEDED) {
      await this.paymentRepository.updatePaymentMetadata({
        paymentId: payment.id,
        metadata,
      });
      await this.completePaymentService.complete({
        paymentId: payment.id,
      });
      return;
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Stripe Checkout is not paid');
    }

    if (
      session.amount_total !== null &&
      session.amount_total !== payment.amount
    ) {
      await this.paymentRepository.markPaymentStatusFailed({
        paymentId: payment.id,
        failedReason: 'Invalid Stripe payment amount',
        metadata,
      });
      throw new BadRequestException('Invalid Stripe payment amount');
    }

    const succeededPayment = await this.paymentRepository.markPaymentSucceeded({
      paymentId: payment.id,
      providerTransactionId: this.getStripeId(session.payment_intent),
      metadata,
    });

    await this.completePaymentService.complete({
      paymentId: succeededPayment.id,
    });
  }

  private async failCheckout(
    session: StripeCheckoutSession,
    webhook: BillingWebhook,
  ): Promise<void> {
    const orderCode = session.metadata?.orderCode;

    if (!orderCode) {
      return;
    }

    const payment =
      await this.paymentRepository.findPaymentByOrderCode(orderCode);

    if (!payment || payment.status !== PaymentStatus.PENDING) {
      return;
    }

    webhook.paymentId = payment.id;
    webhook.orderCode = payment.orderCode;

    await this.paymentRepository.markPaymentStatusFailed({
      paymentId: payment.id,
      failedReason: 'Stripe Checkout session expired',
      metadata: await this.checkoutMetadata(session),
    });
  }

  private async updateSubscriptionFromInvoice(
    invoice: StripeInvoice,
    status: SubscriptionStatus,
  ): Promise<void> {
    const parentSubscription = invoice.parent?.subscription_details?.subscription;
    const providerSubscriptionId = this.getStripeId(parentSubscription);

    if (!providerSubscriptionId) {
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: {
        provider: BillingProvider.STRIPE,
        providerSubscriptionId,
      },
    });

    if (!subscription) {
      return;
    }

    subscription.status = status;

    if (invoice.period_start) {
      subscription.currentPeriodStart = new Date(invoice.period_start * 1000);
    }

    if (invoice.period_end) {
      subscription.currentPeriodEnd = new Date(invoice.period_end * 1000);
    }

    await this.subscriptionRepository.save(subscription);
  }

  private async updateSubscriptionStatus(
    providerSubscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        provider: BillingProvider.STRIPE,
        providerSubscriptionId,
      },
    });

    if (!subscription) {
      return;
    }

    subscription.status = status;
    subscription.cancelledAt = new Date();
    await this.subscriptionRepository.save(subscription);
  }

  private async checkoutMetadata(
    session: StripeCheckoutSession,
  ): Promise<Record<string, unknown>> {
    const card = await this.getCardDetails(session.payment_intent);
    const paymentDetails =
      card ?? (await this.getSubscriptionCardDetails(session.subscription));

    return {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        paymentDetails?.paymentIntentId ??
        this.getStripeId(session.payment_intent),
      stripeSubscriptionId: this.getStripeId(session.subscription),
      cardBrand: paymentDetails?.brand ?? null,
      cardLast4: paymentDetails?.last4 ?? null,
      paymentStatus: session.payment_status,
      status: session.status,
      amountTotal: session.amount_total,
      currency: session.currency,
    };
  }

  private async getCardDetails(
    paymentIntent: StripeCheckoutSession['payment_intent'],
  ): Promise<{
    paymentIntentId: string;
    brand: string;
    last4: string;
  } | null> {
    const paymentIntentId = this.getStripeId(paymentIntent);

    if (!paymentIntentId) {
      return null;
    }

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method'],
    });
    const paymentMethod = intent.payment_method;

    if (
      !paymentMethod ||
      typeof paymentMethod === 'string' ||
      paymentMethod.type !== 'card' ||
      !paymentMethod.card
    ) {
      return null;
    }

    return {
      paymentIntentId,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
    };
  }

  private async getSubscriptionCardDetails(
    subscriptionValue: StripeCheckoutSession['subscription'],
  ): Promise<{
    paymentIntentId: string;
    brand: string;
    last4: string;
  } | null> {
    const subscriptionId = this.getStripeId(subscriptionValue);

    if (!subscriptionId) {
      return null;
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      subscriptionId,
      {
        expand: ['latest_invoice'],
      },
    );
    const invoiceId = this.getStripeId(subscription.latest_invoice);

    if (!invoiceId) {
      return null;
    }

    const invoicePayments = await this.stripe.invoicePayments.list({
      invoice: invoiceId,
      status: 'paid',
      limit: 1,
      expand: ['data.payment.payment_intent.payment_method'],
    });
    const invoicePayment = invoicePayments.data[0];
    const paymentIntent = invoicePayment?.payment.payment_intent;

    if (!paymentIntent) {
      return null;
    }

    return this.getCardDetails(paymentIntent);
  }

  private getStripeId(
    value:
      | string
      | { id: string }
      | null
      | undefined,
  ): string | null {
    if (typeof value === 'string') {
      return value;
    }

    return value?.id ?? null;
  }
}
