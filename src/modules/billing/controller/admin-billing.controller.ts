import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { Repository } from 'typeorm';

import { AdminCreatePlanDto } from '../dto/request/admin-create-plan.dto';
import { AdminUpdatePlanStatusDto } from '../dto/request/admin-update-plan-status.dto';
import { AdminUpdatePlanDto } from '../dto/request/admin-update-plan.dto';
import { CancelAdminSubscriptionDto } from '../dto/request/cancel-admin-subscription.dto';
import { GrantAdminSubscriptionDto } from '../dto/request/grant-admin-subscription.dto';
import { RevokeAdminSubscriptionDto } from '../dto/request/revoke-admin-subscription.dto';
import { ResumeAdminSubscriptionDto } from '../dto/request/resume-admin-subscription.dto';
import { Payment, PaymentStatus } from '../domain/entities/payment.entity';
import { Subscription } from '../domain/entities/subscription.entity';
import {
  AdminBillingPlanRow,
  AdminBillingPlanService,
} from '../services/admin/admin-billing-plan.service';
import {
  AdminCancelSubscriptionResult,
  AdminGrantSubscriptionResult,
  AdminRevokeSubscriptionResult,
  AdminResumeSubscriptionResult,
  AdminSubscriptionGrantService,
} from '../services/admin/admin-subscription-grant.service';

type AdminBillingSubscriptionRow = {
  rowId: string;
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
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
  userId: string;
  userDisplayName: string | null;
  userFullName: string | null;
  username: string;
  userEmail: string;
  planCode: string;
  planName: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: Date | null;
  renewAt: Date | null;
  trialEndsAt: Date | null;
  amount: number;
  paymentMethod: string;
  subscriptionProvider: string;
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

@RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
@Controller('admin/billing')
@AdminRateLimit()
export class AdminBillingController {
  constructor(
    private readonly adminBillingPlanService: AdminBillingPlanService,
    private readonly adminSubscriptionGrantService: AdminSubscriptionGrantService,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  @Get('plans')
  @ResponseMessage('Get admin billing plans successfully')
  async getPlans(): Promise<AdminBillingPlanRow[]> {
    return this.adminBillingPlanService.getPlans();
  }

  @Post('plans')
  @ResponseMessage('Create admin billing plan successfully')
  createPlan(@Body() dto: AdminCreatePlanDto): Promise<AdminBillingPlanRow> {
    return this.adminBillingPlanService.createPlan(dto);
  }

  @Patch('plans/:planId')
  @ResponseMessage('Update admin billing plan successfully')
  updatePlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: AdminUpdatePlanDto,
  ): Promise<AdminBillingPlanRow> {
    return this.adminBillingPlanService.updatePlan(planId, dto);
  }

  @Patch('plans/:planId/status')
  @ResponseMessage('Update admin billing plan status successfully')
  updatePlanStatus(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: AdminUpdatePlanStatusDto,
  ): Promise<AdminBillingPlanRow> {
    return this.adminBillingPlanService.updatePlanStatus(planId, dto);
  }

  @Post('subscriptions/grant')
  @ResponseMessage('Grant admin billing subscription successfully')
  grantSubscription(
    @Body() dto: GrantAdminSubscriptionDto,
  ): Promise<AdminGrantSubscriptionResult> {
    return this.adminSubscriptionGrantService.grant(dto);
  }

  @Post('subscriptions/revoke')
  @ResponseMessage('Revoke admin billing subscription successfully')
  revokeSubscription(
    @Body() dto: RevokeAdminSubscriptionDto,
  ): Promise<AdminRevokeSubscriptionResult> {
    return this.adminSubscriptionGrantService.revoke(dto);
  }

  @Patch('subscriptions/:subscriptionId/cancel')
  @ResponseMessage('Cancel admin billing subscription successfully')
  cancelSubscription(
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() dto: CancelAdminSubscriptionDto,
  ): Promise<AdminCancelSubscriptionResult> {
    return this.adminSubscriptionGrantService.cancel(subscriptionId, dto);
  }

  @Patch('subscriptions/:subscriptionId/resume')
  @ResponseMessage('Resume admin billing subscription successfully')
  resumeSubscription(
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() dto: ResumeAdminSubscriptionDto,
  ): Promise<AdminResumeSubscriptionResult> {
    return this.adminSubscriptionGrantService.resume(subscriptionId, dto);
  }

  @Get('subscriptions')
  @ResponseMessage('Get admin billing subscriptions successfully')
  async getSubscriptions(): Promise<AdminBillingSubscriptionRow[]> {
    const rows = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .innerJoin('subscription.user', 'user')
      .leftJoin('user.profile', 'userProfile')
      .innerJoin('subscription.plan', 'plan')
      .select('subscription.id', 'id')
      .addSelect('user.id', 'userId')
      .addSelect('userProfile.displayName', 'userDisplayName')
      .addSelect('userProfile.fullName', 'userFullName')
      .addSelect('user.username', 'username')
      .addSelect('user.email', 'userEmail')
      .addSelect('plan.slug', 'planCode')
      .addSelect('plan.name', 'planName')
      .addSelect('subscription.status', 'status')
      .addSelect('subscription.billingInterval', 'billingCycle')
      .addSelect('subscription.currentPeriodStart', 'currentPeriodStart')
      .addSelect('subscription.currentPeriodEnd', 'renewAt')
      .addSelect('subscription.trialEnd', 'trialEndsAt')
      .addSelect('subscription.amount', 'amount')
      .addSelect('subscription.provider', 'subscriptionProvider')
      .addSelect(
        (qb) =>
          qb
            .select(
              `COALESCE(payment.metadata ->> 'cardBrand', payment.provider::text)`,
            )
            .from(Payment, 'payment')
            .where('payment.subscription_id = subscription.id')
            .andWhere('payment.status = :succeededStatus')
            .orderBy('payment.paid_at', 'DESC')
            .addOrderBy('payment.created_at', 'DESC')
            .limit(1),
        'paymentMethod',
      )
      .addSelect('subscription.createdAt', 'createdAt')
      .setParameter('succeededStatus', PaymentStatus.SUCCEEDED)
      .orderBy('subscription.createdAt', 'DESC')
      .getRawMany<SubscriptionRawRow>();

    return rows.map((row) => ({
      rowId: row.id,
      id: row.id,
      userId: row.userId,
      userName:
        row.userDisplayName ??
        row.userFullName ??
        row.username ??
        row.userEmail,
      userEmail: row.userEmail,
      planCode: row.planCode,
      planName: row.planName,
      status: row.status,
      billingCycle: row.billingCycle,
      startedAt: row.currentPeriodStart ?? row.createdAt,
      renewAt: row.renewAt,
      trialEndsAt: row.trialEndsAt,
      amount: Number(row.amount),
      paymentMethod: row.paymentMethod ?? row.subscriptionProvider ?? 'MANUAL',
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
}
