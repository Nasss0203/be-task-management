import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import {
  BillingRateLimit,
  PublicReadRateLimit,
  ReadRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { IAuth } from 'src/types/auth';

import { CreateBillingCheckoutCommand } from '../../application/commands/checkout/create-billing-checkout/create-billing-checkout.command';
import { CreateBillingCheckoutHandler } from '../../application/commands/checkout/create-billing-checkout/create-billing-checkout.handler';
import { CreateBillingCheckoutRequestDto } from '../../application/dto/request/create-billing-checkout.request.dto';
import { GetBillingPaymentStatusRequestDto } from '../../application/dto/request/get-billing-payment-status.request.dto';
import { BillingPlanListResponseDto } from '../../application/dto/response/billing-plan-list.response.dto';
import { CreateBillingCheckoutResponseDto } from '../../application/dto/response/create-billing-checkout.response.dto';
import { WorkspaceSubscriptionResponseDto } from '../../application/dto/response/workspace-subscription.response.dto';
import { GetBillingPaymentStatusHandler } from '../../application/queries/payment/get-billing-payment-status/get-billing-payment-status.handler';
import { GetBillingPaymentStatusQuery } from '../../application/queries/payment/get-billing-payment-status/get-billing-payment-status.query';
import { ListBillingPlansHandler } from '../../application/queries/plan/list-billing-plans/list-billing-plans.handler';
import { ListBillingPlansQuery } from '../../application/queries/plan/list-billing-plans/list-billing-plans.query';
import { GetWorkspaceSubscriptionHandler } from '../../application/queries/subscription/get-workspace-subscription/get-workspace-subscription.handler';
import { GetWorkspaceSubscriptionQuery } from '../../application/queries/subscription/get-workspace-subscription/get-workspace-subscription.query';
import { BILLING_TYPES } from '../../billing.types';

@Controller('billing')
export class BillingController {
  constructor(
    @Inject(BILLING_TYPES.applications.ListBillingPlansHandler)
    private readonly listBillingPlansHandler: ListBillingPlansHandler,

    @Inject(BILLING_TYPES.applications.CreateBillingCheckoutHandler)
    private readonly createBillingCheckoutHandler: CreateBillingCheckoutHandler,

    @Inject(BILLING_TYPES.applications.GetBillingPaymentStatusHandler)
    private readonly getBillingPaymentStatusHandler: GetBillingPaymentStatusHandler,

    @Inject(BILLING_TYPES.applications.GetWorkspaceSubscriptionHandler)
    private readonly getWorkspaceSubscriptionHandler: GetWorkspaceSubscriptionHandler,

    private readonly configService: ConfigService,
  ) {}

  @Get('plans')
  @Public()
  @PublicReadRateLimit()
  @ResponseMessage('Get billing plans successfully')
  listPlans(): Promise<BillingPlanListResponseDto> {
    return this.listBillingPlansHandler.execute(new ListBillingPlansQuery());
  }

  @Get('workspaces/:workspaceId/subscription')
  @ReadRateLimit()
  @WorkspaceContext({
    source: 'param',
    key: 'workspaceId',
  })
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ResponseMessage('Get workspace subscription successfully')
  getWorkspaceSubscription(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceSubscriptionResponseDto> {
    return this.getWorkspaceSubscriptionHandler.execute(
      new GetWorkspaceSubscriptionQuery(workspaceId),
    );
  }

  @Post('checkout')
  @BillingRateLimit()
  @WorkspaceContext({
    source: 'body',
    key: 'workspaceId',
  })
  @RequirePermissions(PERMISSIONS.WORKSPACE_UPDATE)
  @ResponseMessage('Create billing checkout successfully')
  createCheckout(
    @Body() dto: CreateBillingCheckoutRequestDto,
    @Auth() auth: IAuth,
  ): Promise<CreateBillingCheckoutResponseDto> {
    return this.createBillingCheckoutHandler.execute(
      new CreateBillingCheckoutCommand(
        dto.workspaceId,
        dto.planPriceId,
        auth.id,
      ),
    );
  }

  @Post('payment-status')
  @HttpCode(200)
  @WorkspaceContext({
    source: 'body',
    key: 'workspaceId',
  })
  @RequirePermissions(PERMISSIONS.WORKSPACE_UPDATE)
  @ResponseMessage('Get billing payment status successfully')
  getPaymentStatus(@Body() dto: GetBillingPaymentStatusRequestDto) {
    return this.getBillingPaymentStatusHandler.execute(
      new GetBillingPaymentStatusQuery(dto.workspaceId, dto.paymentOrderId),
    );
  }

  @Get('payment-return')
  @Public()
  @PublicReadRateLimit()
  paymentReturn(
    @Query('paymentOrderId') paymentOrderId: unknown,
    @Query('workspaceId') workspaceId: unknown,
    @Query('status') status: unknown,
    @Res() response: Response,
  ): void {
    const baseUrl = this.configService
      .getOrThrow<string>('BILLING_FRONTEND_RESULT_URL')
      .trim();

    const url = new URL(baseUrl);

    if (typeof paymentOrderId === 'string') {
      url.searchParams.set('paymentOrderId', paymentOrderId);
    }

    if (typeof workspaceId === 'string') {
      url.searchParams.set('workspaceId', workspaceId);
    }

    if (
      typeof status === 'string' &&
      ['success', 'error', 'cancelled'].includes(status)
    ) {
      url.searchParams.set('status', status);
    }

    response.setHeader('Cache-Control', 'no-store');
    response.redirect(303, url.toString());
  }
}
