import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, MoreThan, Repository } from 'typeorm';

import { PaymentOrderStatus } from '../../../../domain/constants/payment-order-status.constant';
import { PaymentOrder } from '../../../../domain/entities/payment-order.entity';
import type { PaymentOrderRepository } from '../../../../domain/repositories/payment-order.repository';
import { PaymentOrderOrmEntity } from '../entities/payment-order.orm-entity';
import { PaymentOrderMapper } from '../mappers/payment-order.mapper';

@Injectable()
export class TypeOrmPaymentOrderRepository implements PaymentOrderRepository {
  constructor(
    @InjectRepository(PaymentOrderOrmEntity)
    private readonly repository: Repository<PaymentOrderOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<PaymentOrderOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(PaymentOrderOrmEntity)
      : this.repository;
  }

  async save(
    paymentOrder: PaymentOrder,
    context?: PersistenceContext,
  ): Promise<PaymentOrder> {
    const repository = this.getRepository(context);

    const saved = await repository.save(PaymentOrderMapper.toOrm(paymentOrder));

    return PaymentOrderMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PaymentOrder | null> {
    const entity = await this.getRepository(context).findOne({
      where: {
        id,
      },
    });

    return entity ? PaymentOrderMapper.toDomain(entity) : null;
  }

  async findByOrderCode(
    orderCode: string,
    context?: PersistenceContext,
  ): Promise<PaymentOrder | null> {
    const normalizedOrderCode = orderCode.trim().toUpperCase();

    const entity = await this.getRepository(context).findOne({
      where: {
        order_code: normalizedOrderCode,
      },
    });

    return entity ? PaymentOrderMapper.toDomain(entity) : null;
  }

  async findByOrderCodeForUpdate(
    orderCode: string,
    context: PersistenceContext,
  ): Promise<PaymentOrder | null> {
    const normalizedOrderCode = orderCode.trim().toUpperCase();

    const entity = await this.getRepository(context).findOne({
      where: {
        order_code: normalizedOrderCode,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    return entity ? PaymentOrderMapper.toDomain(entity) : null;
  }

  async findUnexpiredPendingByWorkspaceIdAndPlanPriceId(
    workspaceId: string,
    planPriceId: string,
    now: Date,
    context?: PersistenceContext,
  ): Promise<PaymentOrder | null> {
    const entity = await this.getRepository(context).findOne({
      where: {
        workspace_id: workspaceId,
        plan_price_id: planPriceId,
        status: PaymentOrderStatus.PENDING,
        expires_at: MoreThan(now),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return entity ? PaymentOrderMapper.toDomain(entity) : null;
  }
}
