import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import { type Request } from 'express';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { TestCreateVnpayPaymentDto } from '../dto/create-billing.dto';
import { BILLING_TYPES } from '../interfaces/types';
import { type VnpayPaymentProvider } from '../types/payment-input.interface';

@Controller('billing/test-vnpay')
export class BillingTestVnpayController {
  constructor(
    @Inject(BILLING_TYPES.providers.VnpayPaymentProvider)
    private readonly vnpayPaymentProvider: VnpayPaymentProvider,
  ) {}

  @Post()
  @ResponseMessage('Thanh toan vnpay')
  createPayment(@Body() dto: TestCreateVnpayPaymentDto, @Req() req: Request) {
    const orderCode = `PAY_${Date.now()}`;

    const result = this.vnpayPaymentProvider.createPayment({
      orderCode,
      amount: dto.amount,
      orderInfo: dto.orderInfo ?? `Thanh toan don hang ${orderCode}`,
      ipAddress: this.getClientIp(req),
    });

    return {
      message: 'Create VNPAY payment successfully',
      orderCode,
      amount: dto.amount,

      ...result,
    };
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
