import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VnpayService } from 'nestjs-vnpay';
import { ProductCode, VnpLocale, dateFormat } from 'vnpay';

import { BillingProvider } from '../domain/entities/subscription.entity';
import {
  CreateGatewayPaymentInput,
  CreateGatewayPaymentResult,
  VnpayPaymentProvider,
} from '../types/payment-input.interface';

@Injectable()
export class VnpayPaymentProviderImpl implements VnpayPaymentProvider {
  constructor(
    private readonly vnpayService: VnpayService,
    private readonly configService: ConfigService,
  ) {}

  async createPayment(
    input: CreateGatewayPaymentInput,
  ): Promise<CreateGatewayPaymentResult> {
    const returnUrl = this.configService.getOrThrow<string>('VNPAY_RETURN_URL');

    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 15);

    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: input.amount,
      vnp_IpAddr: input.ipAddress ?? '127.0.0.1',
      vnp_TxnRef: input.orderCode,
      vnp_OrderInfo: this.normalizeOrderInfo(input.orderInfo),
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(expiredAt),
    });

    return {
      provider: BillingProvider.VNPAY,
      paymentUrl,
      providerOrderId: input.orderCode,
      providerRequestId: null,
      providerTransactionId: null,
      rawResponse: {
        paymentUrl,
        orderCode: input.orderCode,
        expiredAt,
      },
    };
  }

  async verifyIpn(query: Record<string, any>) {
    return this.vnpayService.verifyIpnCall(query as any);
  }

  async verifyReturnUrl(query: Record<string, any>) {
    return this.vnpayService.verifyReturnUrl(query as any);
  }

  private normalizeOrderInfo(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^\w\s.-]/g, '')
      .trim();
  }
}
