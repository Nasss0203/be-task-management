import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { Repository } from 'typeorm';

import { Payment } from '../domain/entities/payment.entity';
import { Plan, PlanBillingInterval } from '../domain/entities/plan.entity';
import { SubscriptionWorkspace } from '../domain/entities/subscription-workspace.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../domain/entities/subscription.entity';

type AdminBillingPlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceAmount: number;
  currency: string;
  billingInterval: string;
  monthlyAmount: number;
  estimatedMrr: number;
  features: Record<string, unknown> | null;
  limits: Record<string, unknown> | null;
  isActive: boolean;
  activeSubscriptions: number;
  createdAt: Date;
  updatedAt: Date;
};

type AdminBillingSubscriptionRow = {
  rowId: string;
  id: string;
  workspaceId: string | null;
  workspaceName: string | null;
  ownerName: string | null;
  ownerEmail: string;
  planCode: string;
  planName: string;
  status: string;
  billingCycle: string;
  startedAt: Date;
  renewAt: Date | null;
  trialEndsAt: Date | null;
  amount: number;
  paymentMethod: string;
  couponCode: null;
};

type AdminBillingPaymentRow = {
  id: string;
  invoiceNo: string;
  amount: number;
  status: string;
  paidAt: Date | null;
  subscriptionId: string | null;
  planId: string;
  workspaceId: string | null;
  paymentMethod: string;
  provider: string;
  orderCode: string;
  createdAt: Date;
};

type SubscriptionRawRow = {
  id: string;
  workspaceId: string | null;
  workspaceName: string | null;
  ownerDisplayName: string | null;
  ownerFullName: string | null;
  ownerUsername: string;
  ownerEmail: string;
  planCode: string;
  planName: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: Date | null;
  renewAt: Date | null;
  trialEndsAt: Date | null;
  amount: number;
  paymentMethod: string;
  createdAt: Date;
};

type PaymentRawRow = {
  id: string;
  amount: number;
  status: string;
  paidAt: Date | null;
  subscriptionId: string | null;
  planId: string;
  workspaceId: string | null;
  paymentMethod: string;
  provider: string;
  orderCode: string;
  createdAt: Date;
};

type PlanRawRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceAmount: number;
  currency: string;
  billingInterval: string;
  features: Record<string, unknown> | null;
  limits: Record<string, unknown> | null;
  isActive: boolean;
  activeSubscriptions: string;
  createdAt: Date;
  updatedAt: Date;
};

@RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
@Controller('admin/billing')
export class AdminBillingController {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  @Get('plans')
  @ResponseMessage('Get admin billing plans successfully')
  async getPlans(): Promise<AdminBillingPlanRow[]> {
    const rows = await this.planRepository
      .createQueryBuilder('plan')
      .select('plan.id', 'id')
      .addSelect('plan.name', 'name')
      .addSelect('plan.slug', 'slug')
      .addSelect('plan.description', 'description')
      .addSelect('plan.priceAmount', 'priceAmount')
      .addSelect('plan.currency', 'currency')
      .addSelect('plan.billingInterval', 'billingInterval')
      .addSelect('plan.features', 'features')
      .addSelect('plan.limits', 'limits')
      .addSelect('plan.isActive', 'isActive')
      .addSelect('plan.createdAt', 'createdAt')
      .addSelect('plan.updatedAt', 'updatedAt')
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(subscription.id)', 'count')
            .from(Subscription, 'subscription')
            .where('subscription.plan_id = plan.id')
            .andWhere('subscription.status = :status'),
        'activeSubscriptions',
      )
      .setParameter('status', SubscriptionStatus.ACTIVE)
      .orderBy('plan.sortOrder', 'ASC')
      .addOrderBy('plan.createdAt', 'DESC')
      .getRawMany<PlanRawRow>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      priceAmount: row.priceAmount,
      currency: row.currency,
      billingInterval: row.billingInterval,
      features: row.features,
      limits: row.limits,
      isActive: row.isActive,
      activeSubscriptions: Number(row.activeSubscriptions),
      monthlyAmount: this.calculateMonthlyAmount(
        row.priceAmount,
        row.billingInterval,
      ),
      estimatedMrr:
        this.calculateMonthlyAmount(row.priceAmount, row.billingInterval) *
        Number(row.activeSubscriptions),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  @Get('subscriptions')
  @ResponseMessage('Get admin billing subscriptions successfully')
  async getSubscriptions(): Promise<AdminBillingSubscriptionRow[]> {
    const rows = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .innerJoin('subscription.user', 'owner')
      .leftJoin('owner.profile', 'ownerProfile')
      .innerJoin('subscription.plan', 'plan')
      .leftJoin(
        SubscriptionWorkspace,
        'subscriptionWorkspace',
        'subscriptionWorkspace.subscription_id = subscription.id',
      )
      .leftJoin('subscriptionWorkspace.workspace', 'workspace')
      .select('subscription.id', 'id')
      .addSelect('workspace.id', 'workspaceId')
      .addSelect('workspace.name', 'workspaceName')
      .addSelect('ownerProfile.displayName', 'ownerDisplayName')
      .addSelect('ownerProfile.fullName', 'ownerFullName')
      .addSelect('owner.username', 'ownerUsername')
      .addSelect('owner.email', 'ownerEmail')
      .addSelect('plan.slug', 'planCode')
      .addSelect('plan.name', 'planName')
      .addSelect('subscription.status', 'status')
      .addSelect('plan.billingInterval', 'billingCycle')
      .addSelect('subscription.currentPeriodStart', 'currentPeriodStart')
      .addSelect('subscription.currentPeriodEnd', 'renewAt')
      .addSelect('subscription.trialEnd', 'trialEndsAt')
      .addSelect('plan.priceAmount', 'amount')
      .addSelect('subscription.provider', 'paymentMethod')
      .addSelect('subscription.createdAt', 'createdAt')
      .orderBy('subscription.createdAt', 'DESC')
      .addOrderBy('workspace.name', 'ASC')
      .getRawMany<SubscriptionRawRow>();

    return rows.map((row) => ({
      rowId: `${row.id}:${row.workspaceId ?? 'no-workspace'}`,
      id: row.id,
      workspaceId: row.workspaceId,
      workspaceName: row.workspaceName,
      ownerName:
        row.ownerDisplayName ??
        row.ownerFullName ??
        row.ownerUsername ??
        row.ownerEmail,
      ownerEmail: row.ownerEmail,
      planCode: row.planCode,
      planName: row.planName,
      status: row.status,
      billingCycle: row.billingCycle,
      startedAt: row.currentPeriodStart ?? row.createdAt,
      renewAt: row.renewAt,
      trialEndsAt: row.trialEndsAt,
      amount: row.amount,
      paymentMethod: row.paymentMethod,
      couponCode: null,
    }));
  }

  @Get('payments')
  @ResponseMessage('Get admin billing payments successfully')
  async getPayments(): Promise<AdminBillingPaymentRow[]> {
    const rows = await this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.plan', 'plan')
      .innerJoin('payment.user', 'owner')
      .leftJoin('payment.targetWorkspace', 'targetWorkspace')
      .leftJoin('payment.subscription', 'subscription')
      .select('payment.id', 'id')
      .addSelect('payment.amount', 'amount')
      .addSelect('payment.status', 'status')
      .addSelect('payment.paidAt', 'paidAt')
      .addSelect('subscription.id', 'subscriptionId')
      .addSelect('plan.id', 'planId')
      .addSelect('targetWorkspace.id', 'workspaceId')
      .addSelect('payment.paymentMethod', 'paymentMethod')
      .addSelect('payment.provider', 'provider')
      .addSelect('payment.orderCode', 'orderCode')
      .addSelect('payment.createdAt', 'createdAt')
      .orderBy('payment.createdAt', 'DESC')
      .getRawMany<PaymentRawRow>();

    return rows.map((row) => ({
      id: row.id,
      invoiceNo: row.orderCode,
      amount: row.amount,
      status: row.status,
      paidAt: row.paidAt,
      subscriptionId: row.subscriptionId,
      planId: row.planId,
      workspaceId: row.workspaceId,
      paymentMethod: row.paymentMethod,
      provider: row.provider,
      orderCode: row.orderCode,
      createdAt: row.createdAt,
    }));
  }

  private calculateMonthlyAmount(
    amount: number,
    billingInterval: string,
  ): number {
    if (billingInterval === PlanBillingInterval.MONTH) {
      return amount;
    }

    if (billingInterval === PlanBillingInterval.YEAR) {
      return Math.round(amount / 12);
    }

    return 0;
  }
}
