import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import { type Request } from 'express';

import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { BILLING_TYPES } from '../interfaces/types';
import { type CreateBillingService } from '../interfaces/services/payment/create-payment.service.interface';

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
    @Inject(BILLING_TYPES.services.CreateBillingService)
    private readonly createBillingService: CreateBillingService,
  ) {}

  @Post('payments')
  @ResponseMessage('Create billing payment')
  createPayment(@Body() dto: CreatePaymentDto, @Req() req: AuthRequest) {
    const userId = this.getUserId(req);

    return this.createBillingService.createPayment({
      userId,
      dto,
      ipAddress: this.getClientIp(req),
    });
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
