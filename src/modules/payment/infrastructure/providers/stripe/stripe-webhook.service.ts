import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService
      .get<string>('STRIPE_SECRET_KEY')
      ?.trim();

    if (!secretKey?.startsWith('sk_test_')) {
      throw new Error('Stripe webhook requires a Stripe test secret key');
    }

    this.stripe = new Stripe(secretKey);
  }

  verifyAndParse(rawBody: Buffer, signature?: string): Stripe.Event {
    if (!signature?.trim()) {
      throw new BadRequestException('Missing Stripe webhook signature');
    }

    const webhookSecret = this.configService
      .get<string>('STRIPE_WEBHOOK_SECRET')
      ?.trim();

    if (!webhookSecret?.startsWith('whsec_')) {
      throw new ServiceUnavailableException(
        'Stripe webhook secret is not configured',
      );
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException(
        'Invalid Stripe webhook signature or payload',
      );
    }

    // Tích hợp này chỉ phục vụ sandbox của đồ án.
    if (event.livemode !== false) {
      throw new BadRequestException(
        'Live Stripe webhook events are not allowed',
      );
    }

    return event;
  }
}
