import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, MoreThan, Repository } from 'typeorm';

import { PaymentOrderStatus } from '../../../../domain/constants/payment-order-status.constant';
import { PaymentOrder } from '../../../../domain/entities/payment-order.entity';
import type {
  PaymentOrderHistoryItem,
  PaymentOrderRepository,
} from '../../../../domain/repositories/payment-order.repository';
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

  async lockWorkspace(
    workspaceId: string,
    context: PersistenceContext,
  ): Promise<void> {
    // Lock a stable row even before the first subscription/order exists.
    const rows = await (context as EntityManager).query(
      'SELECT id FROM workspaces WHERE id = $1 FOR UPDATE',
      [workspaceId],
    );
    if (!rows.length) throw new Error('Checkout workspace not found');
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

  async findHistoryByWorkspaceId(
    workspaceId: string,
    limit: number,
  ): Promise<PaymentOrderHistoryItem[]> {
    const rows = await this.repository.query<
      Array<{
        id: string;
        order_code: string;
        plan_code: string;
        plan_name: string;
        billing_interval: PaymentOrderHistoryItem['billingInterval'];
        provider: PaymentOrderHistoryItem['provider'];
        amount: string;
        currency: string;
        status: PaymentOrderHistoryItem['status'];
        paid_at: Date | null;
        created_at: Date;
      }>
    >(
      `SELECT o.id, o.order_code, p.code AS plan_code, p.name AS plan_name,
              pp.billing_interval, o.provider, o.amount, o.currency, o.status,
              o.paid_at, o.created_at
         FROM payment_orders o
         JOIN billing_plan_prices pp ON pp.id = o.plan_price_id
         JOIN billing_plans p ON p.id = pp.plan_id
        WHERE o.workspace_id = $1
        ORDER BY o.created_at DESC
        LIMIT $2`,
      [workspaceId, limit],
    );

    return rows.map((row) => ({
      id: row.id,
      orderCode: row.order_code,
      planCode: row.plan_code,
      planName: row.plan_name,
      billingInterval: row.billing_interval,
      provider: row.provider,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    }));
  }
}
