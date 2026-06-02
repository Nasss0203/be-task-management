import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import { type Request } from 'express';

import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { type BillingQueryApplication } from '../interfaces/applications/billing-query.application.interface';
import { type CreateBillingApplication } from '../interfaces/applications/create-billing.application.interface';
import { BILLING_TYPES } from '../interfaces/types';

type AuthRequest = Request & {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
  };
};

@Controller('billing')
export class BillingController {
  constructor(
    @Inject(BILLING_TYPES.applications.CreateBillingApplication)
    private readonly createBillingApplication: CreateBillingApplication,

    @Inject(BILLING_TYPES.applications.BillingQueryApplication)
    private readonly billingQueryApplication: BillingQueryApplication,
  ) {}

  @Post('payments')
  @RequirePermissions(PERMISSIONS.WORKSPACE_BILLING_MANAGE)
  @ResponseMessage('Create billing payment')
  createPayment(@Body() dto: CreatePaymentDto, @Req() req: AuthRequest) {
    const userId = this.getUserId(req);

    return this.createBillingApplication.createPayment({
      userId,
      dto,
      ipAddress: this.getClientIp(req),
    });
  }

  @Get('current-subscription')
  @ResponseMessage('Get current subscription')
  async getCurrentSubscription(@Req() req: AuthRequest) {
    const userId = this.getUserId(req);

    return this.billingQueryApplication.getCurrentSubscription(userId);
  }

  private getUserId(req: AuthRequest): string {
    const userId = req.user?.id ?? req.user?.sub ?? req.user?.userId;

    if (!userId) {
      throw new Error('User id not found in request');
    }

    return userId;
  }

  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

    return ip.replace('::ffff:', '').replace('::1', '127.0.0.1');
  }
}
