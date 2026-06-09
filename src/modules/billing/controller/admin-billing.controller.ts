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
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { Repository } from 'typeorm';

import { AdminCreatePlanDto } from '../dto/request/admin-create-plan.dto';
import { AdminUpdatePlanStatusDto } from '../dto/request/admin-update-plan-status.dto';
import { AdminUpdatePlanDto } from '../dto/request/admin-update-plan.dto';
import { CancelAdminSubscriptionDto } from '../dto/request/cancel-admin-subscription.dto';
import { GrantAdminSubscriptionDto } from '../dto/request/grant-admin-subscription.dto';
import { RevokeAdminSubscriptionDto } from '../dto/request/revoke-admin-subscription.dto';
import { ResumeAdminSubscriptionDto } from '../dto/request/resume-admin-subscription.dto';
import { Payment } from '../domain/entities/payment.entity';
import { SubscriptionWorkspace } from '../domain/entities/subscription-workspace.entity';
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

@RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
@Controller('admin/billing')
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
  createPlan(
    @Body() dto: AdminCreatePlanDto,
  ): Promise<AdminBillingPlanRow> {
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
      .innerJoin('subscription.user', 'owner')
      .leftJoin('owner.profile', 'ownerProfile')
      .innerJoin('subscription.plan', 'plan')
      .leftJoin(
        SubscriptionWorkspace,
        'subscriptionWorkspace',
        'subscriptionWorkspace.subscription_id = subscription.id',
      )
      .leftJoin('subscriptionWorkspace.workspace', 'workspace')
      .leftJoin(
        Workspace,
        'metadataWorkspace',
        "metadataWorkspace.id = NULLIF(subscription.metadata ->> 'workspaceId', '')::uuid",
      )
      .select('subscription.id', 'id')
      .addSelect('COALESCE(workspace.id, metadataWorkspace.id)', 'workspaceId')
      .addSelect(
        'COALESCE(workspace.name, metadataWorkspace.name)',
        'workspaceName',
      )
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
      .addOrderBy('COALESCE(workspace.name, metadataWorkspace.name)', 'ASC')
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

}
