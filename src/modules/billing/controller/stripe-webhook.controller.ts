import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';

import { Public } from 'src/common/decorator/public.decorator';
import { SkipTransform } from 'src/common/decorator/skip.transform';
import { StripeWebhookService } from '../services/webhook/stripe-webhook.service';

@Controller('billing/stripe')
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post('webhook')
  @Public()
  @SkipTransform()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature || !req.rawBody) {
      throw new BadRequestException('Stripe signature or raw body is missing');
    }

    await this.stripeWebhookService.handle(req.rawBody, signature);

    return { received: true };
  }

  @Get('checkout-session/:sessionId')
  verifyCheckoutSession(
    @Param('sessionId') sessionId: string,
    @Req()
    req: Request & {
      user?: { id?: string; sub?: string; userId?: string };
    },
  ) {
    const userId = req.user?.id ?? req.user?.sub ?? req.user?.userId;

    if (!userId) {
      throw new BadRequestException('User id not found in request');
    }

    return this.stripeWebhookService.verifyCheckoutSession(sessionId, userId);
  }
}
