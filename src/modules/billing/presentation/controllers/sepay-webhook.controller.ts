import {
  BadRequestException,
  Body,
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

import { ProcessSepayPgIpnCommand } from '../../application/commands/webhook/process-sepay-pg-ipn/process-sepay-pg-ipn.command';
import { ProcessSepayPgIpnHandler } from '../../application/commands/webhook/process-sepay-pg-ipn/process-sepay-pg-ipn.handler';
import { ProcessSepayWebhookCommand } from '../../application/commands/webhook/process-sepay-webhook/process-sepay-webhook.command';
import { ProcessSepayWebhookHandler } from '../../application/commands/webhook/process-sepay-webhook/process-sepay-webhook.handler';
import { SepayPgIpnRequestDto } from '../../application/dto/request/sepay-pg-ipn.request.dto';
import { SePayWebhookRequestDto } from '../../application/dto/request/sepay-webhook.request.dto';
import { BILLING_TYPES } from '../../billing.types';
import { SepayPgIpnAuthService } from '../../infrastructure/providers/sepay/sepay-pg-ipn-auth.service';
import { SepayWebhookService } from '../../infrastructure/providers/sepay/sepay-webhook.service';

@Controller('billing/webhooks/sepay')
export class SepayWebhookController {
  constructor(
    @Inject(BILLING_TYPES.applications.ProcessSepayWebhookHandler)
    private readonly webhookHandler: ProcessSepayWebhookHandler,

    @Inject(BILLING_TYPES.providers.SepayWebhookService)
    private readonly sepayWebhookService: SepayWebhookService,

    @Inject(BILLING_TYPES.applications.ProcessSepayPgIpnHandler)
    private readonly pgIpnHandler: ProcessSepayPgIpnHandler,

    @Inject(BILLING_TYPES.providers.SepayPgIpnAuthService)
    private readonly pgIpnAuthService: SepayPgIpnAuthService,
  ) {}

  @Post()
  @Public()
  @SkipTransform()
  @HttpCode(HttpStatus.OK)
  async processWebhook(
    @Body() payload: SePayWebhookRequestDto,
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-sepay-signature') signature?: string,
    @Headers('x-sepay-timestamp') timestamp?: string,
  ): Promise<{ success: true }> {
    if (!request.rawBody) {
      throw new BadRequestException('SePay webhook raw body is unavailable');
    }

    this.sepayWebhookService.verifySignature({
      rawBody: request.rawBody,
      signature,
      timestamp,
    });

    await this.webhookHandler.execute(new ProcessSepayWebhookCommand(payload));

    return { success: true };
  }

  @Post('ipn')
  @Public()
  @SkipTransform()
  @HttpCode(HttpStatus.OK)
  async processPaymentGatewayIpn(
    @Body() payload: SepayPgIpnRequestDto,
    @Headers('x-secret-key') secretKey?: string,
  ): Promise<{ success: true }> {
    const authenticationResult = this.pgIpnAuthService.verify(
      secretKey,
      payload,
    );

    if (authenticationResult === 'SANDBOX_TEST') {
      return { success: true };
    }

    await this.pgIpnHandler.execute(new ProcessSepayPgIpnCommand(payload));

    return { success: true };
  }
}
