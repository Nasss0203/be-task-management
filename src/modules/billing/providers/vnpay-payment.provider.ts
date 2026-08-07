import { Injectable } from '@nestjs/common';
import { BillingProvider } from '../domain/entities/subscription.entity';
import { ConfigService } from '@nestjs/config';
import { VnpayService } from 'nestjs-vnpay';
import {
  ProductCode,
  VnpLocale,
  type ReturnQueryFromVNPay,
} from 'vnpay';

import {
  CreateGatewayPaymentInput,
  CreateGatewayPaymentResult,
  VnpayPaymentProvider,
  VnpayVerifyResult,
} from '../types/payment-input.interface';

const VNPAY_SUCCESS_CODE = '00';

@Injectable()
export class VnpayPaymentProviderImpl implements VnpayPaymentProvider {
  constructor(
    private readonly vnpayService: VnpayService,
    private readonly configService: ConfigService,
  ) { }

  createPayment(input: CreateGatewayPaymentInput): CreateGatewayPaymentResult {
    const clientUrl =
      this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
    const returnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ??
      `${clientUrl}/billing/payment-return`;

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
      vnp_CreateDate: this.formatVnTime(new Date()),
      vnp_ExpireDate: this.formatVnTime(expiredAt),
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

  async verifyReturnUrl(
    query: ReturnQueryFromVNPay,
  ): Promise<VnpayVerifyResult> {
    const result = (await this.vnpayService.verifyReturnUrl(
      query,
    )) as VnpayVerifyResult;

    return this.normalizeVerifyResult(result);
  }

  async verifyIpn(query: ReturnQueryFromVNPay): Promise<VnpayVerifyResult> {
    const result = (await this.vnpayService.verifyIpnCall(
      query,
    )) as VnpayVerifyResult;

    return this.normalizeVerifyResult(result);
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

  private normalizeVerifyResult(result: VnpayVerifyResult): VnpayVerifyResult {
    return {
      ...result,
      isSuccess:
        this.normalizeVnpayCode(result.vnp_ResponseCode) ===
        VNPAY_SUCCESS_CODE &&
        this.normalizeVnpayCode(result.vnp_TransactionStatus) ===
        VNPAY_SUCCESS_CODE,
    };
  }

  private normalizeVnpayCode(value?: string | number): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    return value.toString().padStart(2, '0');
  }

  private formatVnTime(date: Date): number {
    // VNPay expects GMT+7 (Vietnam time)
    const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);

    const year = vnTime.getUTCFullYear();
    const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vnTime.getUTCDate()).padStart(2, '0');
    const hour = String(vnTime.getUTCHours()).padStart(2, '0');
    const minute = String(vnTime.getUTCMinutes()).padStart(2, '0');
    const second = String(vnTime.getUTCSeconds()).padStart(2, '0');

    return Number(`${year}${month}${day}${hour}${minute}${second}`);
  }
}
