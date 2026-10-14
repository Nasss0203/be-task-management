import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';

import { Public } from 'src/common/decorator/public.decorator';
import { SkipTransform } from 'src/common/decorator/skip.transform';

import { StripeWebhookService } from '../payment/infrastructure/providers/stripe/stripe-webhook.service';
import { PAYMENT_TYPES } from '../payment/payment.types';

import { StripeWebhookRouter } from './stripe-webhook-router.service';

@Controller('billing/webhooks/stripe')
@SkipThrottle()
export class StripeWebhookController {
  constructor(
    @Inject(PAYMENT_TYPES.providers.StripeWebhookService)
    private readonly stripeWebhookService: StripeWebhookService,

    private readonly router: StripeWebhookRouter,
  ) {}

  @Post()
  @Public()
  @SkipTransform()
  @HttpCode(HttpStatus.OK)
  async processWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ): Promise<{ received: true }> {
    if (!request.rawBody) {
      throw new BadRequestException('Stripe webhook raw body is unavailable');
    }

    const event = this.stripeWebhookService.verifyAndParse(
      request.rawBody,
      signature,
    );

    await this.router.dispatch(event);

    return { received: true };
  }
}
