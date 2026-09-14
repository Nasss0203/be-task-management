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
import type { Request } from 'express';

import { Public } from 'src/common/decorator/public.decorator';
import { SkipTransform } from 'src/common/decorator/skip.transform';

import { ProcessStripeWebhookCommand } from '../../application/commands/webhook/process-stripe-webhook/process-stripe-webhook.command';
import { ProcessStripeWebhookHandler } from '../../application/commands/webhook/process-stripe-webhook/process-stripe-webhook.handler';
import { BILLING_TYPES } from '../../billing.types';
import { StripeWebhookService } from '../../infrastructure/providers/stripe/stripe-webhook.service';

@Controller('billing/webhooks/stripe')
export class StripeWebhookController {
  constructor(
    @Inject(BILLING_TYPES.providers.StripeWebhookService)
    private readonly stripeWebhookService: StripeWebhookService,

    @Inject(BILLING_TYPES.applications.ProcessStripeWebhookHandler)
    private readonly handler: ProcessStripeWebhookHandler,
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

    await this.handler.execute(new ProcessStripeWebhookCommand(event));

    return { received: true };
  }
}
