import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SePayPgClient } from 'sepay-pg-node';

import type {
  CreateSepayPgCheckoutInput,
  SepayPgCheckoutFieldValue,
  SepayPgCheckoutPort,
  SepayPgCheckoutResult,
} from '../../../application/ports/sepay-pg-checkout.port';

@Injectable()
export class SepayPgCheckoutService implements SepayPgCheckoutPort {
  private readonly client: SePayPgClient;
  private readonly merchantId: string;

  constructor(private readonly configService: ConfigService) {
    const environment = this.getRequiredConfig('SEPAY_PG_ENV').toLowerCase();

    if (environment !== 'sandbox' && environment !== 'production') {
      throw new Error('SEPAY_PG_ENV must be sandbox or production');
    }

    this.merchantId = this.getRequiredConfig('SEPAY_PG_MERCHANT_ID');

    this.client = new SePayPgClient({
      env: environment,
      merchant_id: this.merchantId,
      secret_key: this.getRequiredConfig('SEPAY_PG_SECRET_KEY'),
      api_version: 'v1',
      checkout_version: 'v1',
    });
  }

  createCheckout(input: CreateSepayPgCheckoutInput): SepayPgCheckoutResult {
    /*
     * Không thay đổi thứ tự các trường bên dưới.
     * SePay sử dụng thứ tự này khi tạo và kiểm tra chữ ký.
     */
    const generatedFields = this.client.checkout.initOneTimePaymentFields({
      order_amount: input.amount,
      merchant: this.merchantId,
      currency: input.currency,
      operation: 'PURCHASE',
      order_description: `TaskManly billing order ${input.orderCode}`,
      order_invoice_number: input.orderCode,
      payment_method: 'BANK_TRANSFER',
      success_url: this.buildResultUrl(input, 'success'),
      error_url: this.buildResultUrl(input, 'error'),
      cancel_url: this.buildResultUrl(input, 'cancelled'),
    });

    const checkoutFields: Record<string, SepayPgCheckoutFieldValue> = {};

    for (const [name, value] of Object.entries(generatedFields)) {
      if (typeof value === 'string' || typeof value === 'number') {
        checkoutFields[name] = value;
      }
    }

    return {
      checkoutUrl: this.client.checkout.initCheckoutUrl(),
      checkoutMethod: 'POST',
      checkoutFields,
    };
  }

  private buildResultUrl(
    input: CreateSepayPgCheckoutInput,
    status: 'success' | 'error' | 'cancelled',
  ): string {
    const url = new URL(this.getRequiredConfig('BILLING_FRONTEND_RESULT_URL'));
    url.searchParams.set('paymentOrderId', input.paymentOrderId);
    url.searchParams.set('workspaceId', input.workspaceId);
    url.searchParams.set('status', status);
    return url.toString();
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new Error(`${key} is not configured`);
    }

    return value;
  }
}
