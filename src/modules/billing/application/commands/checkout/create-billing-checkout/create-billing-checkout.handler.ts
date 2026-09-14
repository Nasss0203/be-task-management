import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { BILLING_TYPES } from '../../../../billing.types';
import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { PaymentOrder } from '../../../../domain/entities/payment-order.entity';
import type { BillingPlanPriceRepository } from '../../../../domain/repositories/billing-plan-price.repository';
import type { PaymentOrderRepository } from '../../../../domain/repositories/payment-order.repository';
import { CreateBillingCheckoutResponseDto } from '../../../dto/response/create-billing-checkout.response.dto';
import type { SepayPgCheckoutPort } from '../../../ports/sepay-pg-checkout.port';
import type { StripeCheckoutPort } from '../../../ports/stripe-checkout.port';
import { WorkspaceSubscriptionProvisioningService } from '../../../services/workspace-subscription-provisioning.service';
import { CreateBillingCheckoutCommand } from './create-billing-checkout.command';

const CHECKOUT_EXPIRATION_MS = 60 * 60 * 1000;

@Injectable()
export class CreateBillingCheckoutHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.BillingPlanPriceRepository)
    private readonly billingPlanPriceRepository: BillingPlanPriceRepository,

    @Inject(BILLING_TYPES.repositories.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,

    @Inject(BILLING_TYPES.services.WorkspaceSubscriptionProvisioningService)
    private readonly subscriptionProvisioningService: WorkspaceSubscriptionProvisioningService,

    @Inject(BILLING_TYPES.providers.SepayPgCheckoutService)
    private readonly sepayPgCheckoutService: SepayPgCheckoutPort,

    @Inject(BILLING_TYPES.providers.StripeCheckoutService)
    private readonly stripeCheckoutService: StripeCheckoutPort,
  ) {}

  async execute(
    command: CreateBillingCheckoutCommand,
  ): Promise<CreateBillingCheckoutResponseDto> {
    const planPrice = await this.billingPlanPriceRepository.findActiveById(
      command.planPriceId,
    );

    if (!planPrice) {
      throw new NotFoundException('Billing plan price not found or inactive');
    }

    const provider = planPrice.getProvider();

    if (
      provider !== BillingProvider.SEPAY &&
      provider !== BillingProvider.STRIPE
    ) {
      throw new BadRequestException('Billing provider is not supported');
    }

    if (planPrice.getCurrency() !== 'VND') {
      throw new BadRequestException(
        'Billing checkout currently supports VND only',
      );
    }

    const subscription =
      await this.subscriptionProvisioningService.getOrCreateInitialFree(
        command.workspaceId,
      );

    const now = new Date();

    const existingPaymentOrder =
      await this.paymentOrderRepository.findUnexpiredPendingByWorkspaceIdAndPlanPriceId(
        command.workspaceId,
        command.planPriceId,
        now,
      );

    if (existingPaymentOrder) {
      const existingSubscriptionId = existingPaymentOrder.getSubscriptionId();

      if (
        existingSubscriptionId &&
        existingSubscriptionId !== subscription.getId()
      ) {
        throw new ConflictException(
          'Pending payment order belongs to another subscription',
        );
      }

      if (!existingSubscriptionId) {
        existingPaymentOrder.attachSubscription(subscription.getId(), now);

        const updatedPaymentOrder =
          await this.paymentOrderRepository.save(existingPaymentOrder);

        return this.toResponse(updatedPaymentOrder);
      }

      return this.toResponse(existingPaymentOrder);
    }

    const paymentOrder = PaymentOrder.create({
      workspaceId: command.workspaceId,
      subscriptionId: subscription.getId(),
      planPriceId: planPrice.getId(),
      provider,
      orderCode: this.generateOrderCode(),
      amount: planPrice.getAmount(),
      currency: planPrice.getCurrency(),
      expiresAt: new Date(now.getTime() + CHECKOUT_EXPIRATION_MS),
      createdBy: command.actorId,
      createdAt: now,
      updatedAt: now,
    });

    const savedPaymentOrder =
      await this.paymentOrderRepository.save(paymentOrder);

    return this.toResponse(savedPaymentOrder);
  }

  private generateOrderCode(): string {
    const uniquePart = randomUUID().replace(/-/g, '').toUpperCase();

    return `TM${uniquePart}`;
  }

  private async toResponse(
    paymentOrder: PaymentOrder,
  ): Promise<CreateBillingCheckoutResponseDto> {
    const expiresAt = paymentOrder.getExpiresAt();

    if (!expiresAt) {
      throw new Error('Checkout payment order must have an expiration time');
    }

    const provider = paymentOrder.getProvider();

    let checkout: Pick<
      CreateBillingCheckoutResponseDto,
      'checkoutUrl' | 'checkoutMethod' | 'checkoutFields'
    >;

    if (provider === BillingProvider.SEPAY) {
      checkout = this.sepayPgCheckoutService.createCheckout({
        paymentOrderId: paymentOrder.getId(),
        workspaceId: paymentOrder.getWorkspaceId(),
        orderCode: paymentOrder.getOrderCode(),
        amount: paymentOrder.getAmount(),
        currency: paymentOrder.getCurrency(),
      });
    } else if (provider === BillingProvider.STRIPE) {
      checkout = await this.stripeCheckoutService.createCheckout({
        paymentOrderId: paymentOrder.getId(),
        workspaceId: paymentOrder.getWorkspaceId(),
        orderCode: paymentOrder.getOrderCode(),
        amount: paymentOrder.getAmount(),
        currency: paymentOrder.getCurrency(),
        expiresAt,
      });
    } else {
      throw new BadRequestException('Billing provider is not supported');
    }

    return {
      paymentOrderId: paymentOrder.getId(),
      workspaceId: paymentOrder.getWorkspaceId(),
      planPriceId: paymentOrder.getPlanPriceId(),
      orderCode: paymentOrder.getOrderCode(),
      amount: paymentOrder.getAmount(),
      currency: paymentOrder.getCurrency(),
      provider,
      status: paymentOrder.getStatus(),
      expiresAt,
      ...checkout,
    };
  }
}
