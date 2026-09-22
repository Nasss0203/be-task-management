import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_TYPES } from '../../../admin.types';
import { CreateAdminBillingPlanPriceVersionCommand } from '../../../application/commands/create-admin-billing-plan-price-version/create-admin-billing-plan-price-version.command';
import { CreateAdminBillingPlanPriceVersionHandler } from '../../../application/commands/create-admin-billing-plan-price-version/create-admin-billing-plan-price-version.handler';
import { UpdateAdminBillingPlanCommand } from '../../../application/commands/update-admin-billing-plan/update-admin-billing-plan.command';
import { UpdateAdminBillingPlanHandler } from '../../../application/commands/update-admin-billing-plan/update-admin-billing-plan.handler';
import { CreateAdminBillingPlanPriceVersionRequestDto } from '../../../application/dto/request/create-admin-billing-plan-price-version.request.dto';
import { ListAdminBillingPaymentOrdersRequestDto } from '../../../application/dto/request/list-admin-billing-payment-orders.request.dto';
import { ListAdminBillingPlansRequestDto } from '../../../application/dto/request/list-admin-billing-plans.request.dto';
import { ListAdminBillingSubscriptionsRequestDto } from '../../../application/dto/request/list-admin-billing-subscriptions.request.dto';
import { ListAdminBillingWebhookEventsRequestDto } from '../../../application/dto/request/list-admin-billing-webhook-events.request.dto';
import { UpdateAdminBillingPlanRequestDto } from '../../../application/dto/request/update-admin-billing-plan.request.dto';
import { AdminBillingOverviewResponseDto } from '../../../application/dto/response/admin-billing-overview.response.dto';
import { AdminBillingPaymentOrderListResponseDto } from '../../../application/dto/response/admin-billing-payment-order-list.response.dto';
import { AdminBillingPlanDetailResponseDto } from '../../../application/dto/response/admin-billing-plan-detail.response.dto';
import { AdminBillingPlanListResponseDto } from '../../../application/dto/response/admin-billing-plan-list.response.dto';
import { AdminBillingSubscriptionListResponseDto } from '../../../application/dto/response/admin-billing-subscription-list.response.dto';
import { AdminBillingWebhookEventListResponseDto } from '../../../application/dto/response/admin-billing-webhook-event-list.response.dto';
import { GetAdminBillingOverviewHandler } from '../../../application/queries/get-admin-billing-overview/get-admin-billing-overview.handler';
import { GetAdminBillingOverviewQuery } from '../../../application/queries/get-admin-billing-overview/get-admin-billing-overview.query';
import { GetAdminBillingPlanHandler } from '../../../application/queries/get-admin-billing-plan/get-admin-billing-plan.handler';
import { GetAdminBillingPlanQuery } from '../../../application/queries/get-admin-billing-plan/get-admin-billing-plan.query';
import { ListAdminBillingPaymentOrdersHandler } from '../../../application/queries/list-admin-billing-payment-orders/list-admin-billing-payment-orders.handler';
import { ListAdminBillingPaymentOrdersQuery } from '../../../application/queries/list-admin-billing-payment-orders/list-admin-billing-payment-orders.query';
import { ListAdminBillingPlansHandler } from '../../../application/queries/list-admin-billing-plans/list-admin-billing-plans.handler';
import { ListAdminBillingPlansQuery } from '../../../application/queries/list-admin-billing-plans/list-admin-billing-plans.query';
import { ListAdminBillingSubscriptionsHandler } from '../../../application/queries/list-admin-billing-subscriptions/list-admin-billing-subscriptions.handler';
import { ListAdminBillingSubscriptionsQuery } from '../../../application/queries/list-admin-billing-subscriptions/list-admin-billing-subscriptions.query';
import { ListAdminBillingWebhookEventsHandler } from '../../../application/queries/list-admin-billing-webhook-events/list-admin-billing-webhook-events.handler';
import { ListAdminBillingWebhookEventsQuery } from '../../../application/queries/list-admin-billing-webhook-events/list-admin-billing-webhook-events.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';

@Controller('admin/billing')
@UseGuards(AdminPermissionGuard)
export class AdminBillingController {
  constructor(
    @Inject(ADMIN_TYPES.applications.GetAdminBillingOverviewHandler)
    private readonly getAdminBillingOverviewHandler: GetAdminBillingOverviewHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminBillingSubscriptionsHandler)
    private readonly listAdminBillingSubscriptionsHandler: ListAdminBillingSubscriptionsHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminBillingPaymentOrdersHandler)
    private readonly listAdminBillingPaymentOrdersHandler: ListAdminBillingPaymentOrdersHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminBillingWebhookEventsHandler)
    private readonly listAdminBillingWebhookEventsHandler: ListAdminBillingWebhookEventsHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminBillingPlansHandler)
    private readonly listAdminBillingPlansHandler: ListAdminBillingPlansHandler,

    @Inject(ADMIN_TYPES.applications.GetAdminBillingPlanHandler)
    private readonly getAdminBillingPlanHandler: GetAdminBillingPlanHandler,

    @Inject(ADMIN_TYPES.applications.UpdateAdminBillingPlanHandler)
    private readonly updateAdminBillingPlanHandler: UpdateAdminBillingPlanHandler,

    @Inject(ADMIN_TYPES.applications.CreateAdminBillingPlanPriceVersionHandler)
    private readonly createAdminBillingPlanPriceVersionHandler: CreateAdminBillingPlanPriceVersionHandler,
  ) {}

  @Get('overview')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get admin billing overview successfully')
  getOverview(): Promise<AdminBillingOverviewResponseDto> {
    return this.getAdminBillingOverviewHandler.execute(
      new GetAdminBillingOverviewQuery(),
    );
  }

  @Get('subscriptions')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get admin billing subscriptions successfully')
  listSubscriptions(
    @Query()
    request: ListAdminBillingSubscriptionsRequestDto,
  ): Promise<AdminBillingSubscriptionListResponseDto> {
    return this.listAdminBillingSubscriptionsHandler.execute(
      new ListAdminBillingSubscriptionsQuery(
        request.page,
        request.limit,
        request.search,
        request.status,
        request.provider,
        request.planCode,
      ),
    );
  }

  @Get('payment-orders')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get admin billing payment orders successfully')
  listPaymentOrders(
    @Query()
    request: ListAdminBillingPaymentOrdersRequestDto,
  ): Promise<AdminBillingPaymentOrderListResponseDto> {
    return this.listAdminBillingPaymentOrdersHandler.execute(
      new ListAdminBillingPaymentOrdersQuery(
        request.page,
        request.limit,
        request.search,
        request.status,
        request.provider,
        request.planCode,
      ),
    );
  }

  @Get('webhook-events')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get admin billing webhook events successfully')
  listWebhookEvents(
    @Query()
    request: ListAdminBillingWebhookEventsRequestDto,
  ): Promise<AdminBillingWebhookEventListResponseDto> {
    return this.listAdminBillingWebhookEventsHandler.execute(
      new ListAdminBillingWebhookEventsQuery(
        request.page,
        request.limit,
        request.search,
        request.provider,
        request.status,
        request.eventType,
      ),
    );
  }

  @Get('plans')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get admin billing plans successfully')
  listPlans(
    @Query() request: ListAdminBillingPlansRequestDto,
  ): Promise<AdminBillingPlanListResponseDto> {
    return this.listAdminBillingPlansHandler.execute(
      new ListAdminBillingPlansQuery(
        request.page,
        request.limit,
        request.search,
        request.isActive,
        request.isPublic,
        request.provider,
        request.billingInterval,
      ),
    );
  }

  @Get('plans/:planId')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get admin billing plan successfully')
  getPlan(
    @Param('planId', new ParseUUIDPipe())
    planId: string,
  ): Promise<AdminBillingPlanDetailResponseDto> {
    return this.getAdminBillingPlanHandler.execute(
      new GetAdminBillingPlanQuery(planId),
    );
  }

  @Patch('plans/:planId')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_UPDATE)
  @ResponseMessage('Update admin billing plan successfully')
  updatePlan(
    @Param('planId', new ParseUUIDPipe())
    planId: string,
    @Body() request: UpdateAdminBillingPlanRequestDto,
  ): Promise<AdminBillingPlanDetailResponseDto> {
    return this.updateAdminBillingPlanHandler.execute(
      new UpdateAdminBillingPlanCommand(
        planId,
        request.name,
        request.description,
        request.isActive,
        request.isPublic,
        request.features?.map((feature) => ({
          featureId: feature.featureId,
          value: feature.value,
        })),
      ),
    );
  }

  @Post('plans/:planId/prices/:priceId/versions')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_UPDATE)
  @ResponseMessage('Create admin billing plan price version successfully')
  createPlanPriceVersion(
    @Param('planId', new ParseUUIDPipe())
    planId: string,
    @Param('priceId', new ParseUUIDPipe())
    priceId: string,
    @Body()
    request: CreateAdminBillingPlanPriceVersionRequestDto,
  ): Promise<AdminBillingPlanDetailResponseDto> {
    return this.createAdminBillingPlanPriceVersionHandler.execute(
      new CreateAdminBillingPlanPriceVersionCommand(
        planId,
        priceId,
        request.amount,
      ),
    );
  }
}
