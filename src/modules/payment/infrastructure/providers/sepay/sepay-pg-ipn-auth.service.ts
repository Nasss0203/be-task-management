import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

export type SepayPgIpnAuthenticationResult = 'AUTHENTICATED' | 'SANDBOX_TEST';

@Injectable()
export class SepayPgIpnAuthService {
  constructor(private readonly configService: ConfigService) {}

  verify(
    receivedSecret?: string,
    payload?: unknown,
  ): SepayPgIpnAuthenticationResult {
    const expectedSecret = this.configService.get<string>(
      'SEPAY_PG_SECRET_KEY',
    );

    if (!expectedSecret) {
      throw new InternalServerErrorException(
        'SePay Payment Gateway secret is not configured',
      );
    }

    if (!receivedSecret) {
      if (this.isUnsignedSandboxIntegrationTest(payload)) {
        return 'SANDBOX_TEST';
      }

      throw new UnauthorizedException('Missing SePay PG IPN secret');
    }

    const expectedBuffer = Buffer.from(expectedSecret, 'utf8');
    const receivedBuffer = Buffer.from(receivedSecret, 'utf8');

    const isValid =
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) {
      throw new UnauthorizedException('Invalid SePay PG IPN secret');
    }

    return 'AUTHENTICATED';
  }

  private isUnsignedSandboxIntegrationTest(payload: unknown): boolean {
    const environment = this.configService
      .get<string>('SEPAY_PG_ENV')
      ?.trim()
      .toLowerCase();

    if (environment !== 'sandbox' || !this.isRecord(payload)) {
      return false;
    }

    const order = payload.order;
    const transaction = payload.transaction;

    if (!this.isRecord(order) || !this.isRecord(transaction)) {
      return false;
    }

    const customData = order.custom_data;

    if (!this.isRecord(customData)) {
      return false;
    }

    return (
      payload.notification_type === 'PAYMENT_SUCCESS' &&
      typeof order.order_id === 'string' &&
      order.order_id.startsWith('TEST_ORDER_') &&
      typeof transaction.transaction_id === 'string' &&
      transaction.transaction_id.startsWith('TEST_TXN_') &&
      customData.test_mode === true &&
      customData.webhook_test === true
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
