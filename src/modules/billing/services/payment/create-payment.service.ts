import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { randomUUID } from 'node:crypto';

import { BILLING_TYPES } from '../../interfaces/types';
import { CheckoutProvider } from '../../dto/create-payment.dto';
import { BillingProvider } from '../../domain/entities/subscription.entity';
import { type PlanRepository } from '../../interfaces/repositories/plan/plan.repository.interface';
import { type PaymentRepository } from '../../interfaces/repositories/payment/payment.repository.interface';
import {
  CreateBillingService,
  CreatePaymentServiceInput,
  CreatePaymentServiceResponse,
} from '../../interfaces/services/payment/create-payment.service.interface';
import {
  type StripePaymentProvider,
  type VnpayPaymentProvider,
} from '../../types/payment-input.interface';

@Injectable()
export class CreateBillingServiceImpl implements CreateBillingService {
  constructor(
    @Inject(BILLING_TYPES.repositories.PlanRepository)
    private readonly planRepository: PlanRepository,

    @Inject(BILLING_TYPES.repositories.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,

    @Inject(BILLING_TYPES.providers.VnpayPaymentProvider)
    private readonly vnpayPaymentProvider: VnpayPaymentProvider,

    @Inject(BILLING_TYPES.providers.StripePaymentProvider)
    private readonly stripePaymentProvider: StripePaymentProvider,
  ) {}

  async createPayment(
    input: CreatePaymentServiceInput,
    manager?: EntityManager,
  ): Promise<CreatePaymentServiceResponse> {
    const plan = await this.planRepository.findActivePlanById(
      input.dto.planId,
      manager,
    );

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (plan.priceAmount <= 0) {
      throw new BadRequestException('Free plan does not require payment');
    }

    const provider =
      input.dto.provider === CheckoutProvider.STRIPE
        ? BillingProvider.STRIPE
        : BillingProvider.VNPAY;
    const orderCode = `PAY_${Date.now()}_${randomUUID().slice(0, 8)}`;

    const payment = await this.paymentRepository.createPendingPayment(
      {
        userId: input.userId,
        plan,
        orderCode,
        targetWorkspaceId: input.dto.targetWorkspaceId ?? null,
        provider,
      },
      manager,
    );

    try {
      const gatewayPayment =
        provider === BillingProvider.STRIPE
          ? await this.stripePaymentProvider.createCheckout({
              paymentId: payment.id,
              orderCode,
              userId: input.userId,
              planId: plan.id,
              planName: plan.name,
              amount: plan.priceAmount,
              currency: plan.currency,
              billingInterval: plan.billingInterval,
              targetWorkspaceId: input.dto.targetWorkspaceId ?? null,
            })
          : this.vnpayPaymentProvider.createPayment({
              orderCode,
              amount: plan.priceAmount,
              orderInfo: `Thanh toan goi ${plan.name}`,
              ipAddress: input.ipAddress,
            });

      const updatedPayment = await this.paymentRepository.updatePaymentGateway(
        {
          paymentId: payment.id,
          paymentUrl: gatewayPayment.paymentUrl,
          providerOrderId: gatewayPayment.providerOrderId,
          providerRequestId: gatewayPayment.providerRequestId,
          providerTransactionId: gatewayPayment.providerTransactionId,
          rawResponse: gatewayPayment.rawResponse,
          expiredAt: this.extractExpiredAt(gatewayPayment.rawResponse),
        },
        manager,
      );

      return {
        paymentId: updatedPayment.id,
        orderCode: updatedPayment.orderCode,
        provider: updatedPayment.provider,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: updatedPayment.status,
        paymentUrl: updatedPayment.paymentUrl ?? gatewayPayment.paymentUrl,
      };
    } catch (error) {
      await this.paymentRepository.markPaymentFailed(
        {
          paymentId: payment.id,
          failedReason:
            error instanceof Error
              ? error.message
              : `Create ${provider} payment failed`,
          metadata: {
            error:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                  }
                : String(error),
          },
        },
        manager,
      );

      throw error;
    }
  }

  private extractExpiredAt(rawResponse: Record<string, unknown>): Date | null {
    const expiredAt = rawResponse.expiredAt;

    if (expiredAt instanceof Date) {
      return expiredAt;
    }

    if (typeof expiredAt === 'string') {
      return new Date(expiredAt);
    }

    return null;
  }
}
