import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../../domain/entities/payment.entity';
import { BillingProvider } from '../../domain/entities/subscription.entity';
import {
  CreatePendingPaymentInput,
  MarkPaymentFailedInput,
  MarkPaymentStatusFailedInput,
  MarkPaymentSucceededInput,
  PaymentRepository,
  UpdatePaymentGatewayInput,
} from '../../interfaces/repositories/payment/payment.repository.interface';

@Injectable()
export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<Payment> {
    return manager?.getRepository(Payment) ?? this.paymentRepository;
  }

  async createPendingPayment(
    input: CreatePendingPaymentInput,
    manager?: EntityManager,
  ): Promise<Payment> {
    const repo = this.getRepository(manager);

    const payment = repo.create({
      userId: input.userId,
      planId: input.plan.id,
      targetWorkspaceId: input.targetWorkspaceId ?? null,

      orderCode: input.orderCode,
      provider: BillingProvider.VNPAY,

      amount: input.plan.priceAmount,
      currency: input.plan.currency,

      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.UNKNOWN,

      providerPaymentId: null,
      providerOrderId: input.orderCode,
      providerRequestId: null,
      providerTransactionId: null,

      paymentUrl: null,
      expiredAt: null,
      paidAt: null,
      failedReason: null,
      metadata: null,

      subscriptionId: null,
      invoiceId: null,
    });

    return repo.save(payment);
  }

  async updatePaymentGateway(
    input: UpdatePaymentGatewayInput,
    manager?: EntityManager,
  ): Promise<Payment> {
    const repo = this.getRepository(manager);

    const payment = await repo.findOne({
      where: {
        id: input.paymentId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.paymentUrl = input.paymentUrl;
    payment.providerOrderId = input.providerOrderId;
    payment.providerRequestId = input.providerRequestId ?? null;
    payment.providerTransactionId = input.providerTransactionId ?? null;
    payment.expiredAt = input.expiredAt ?? null;
    payment.metadata = input.rawResponse;

    return repo.save(payment);
  }

  async markPaymentFailed(
    input: MarkPaymentFailedInput,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepository(manager);

    const payment = await repo.findOne({
      where: {
        id: input.paymentId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = PaymentStatus.FAILED;
    payment.failedReason = input.failedReason;
    payment.metadata = input.metadata ?? null;

    await repo.save(payment);
  }

  findPaymentByOrderCode(
    orderCode: string,
    manager?: EntityManager,
  ): Promise<Payment | null> {
    return this.getRepository(manager).findOne({
      where: {
        orderCode,
      },
    });
  }

  async markPaymentSucceeded(
    input: MarkPaymentSucceededInput,
    manager?: EntityManager,
  ): Promise<Payment> {
    const repo = this.getRepository(manager);

    const payment = await repo.findOne({
      where: {
        id: input.paymentId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = PaymentStatus.SUCCEEDED;
    payment.providerTransactionId = input.providerTransactionId;
    payment.paidAt = new Date();
    payment.failedReason = null;
    payment.metadata = input.metadata;

    return repo.save(payment);
  }

  async markPaymentStatusFailed(
    input: MarkPaymentStatusFailedInput,
    manager?: EntityManager,
  ): Promise<Payment> {
    const repo = this.getRepository(manager);

    const payment = await repo.findOne({
      where: {
        id: input.paymentId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = PaymentStatus.FAILED;
    payment.failedReason = input.failedReason;
    payment.metadata = input.metadata;

    return repo.save(payment);
  }
}
