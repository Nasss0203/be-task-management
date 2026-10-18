import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

import type { IAuth } from 'src/types/auth';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import { CreateTemplatePurchaseCheckoutCommand } from 'src/modules/marketplace/application/commands/template-purchase/create-template-purchase-checkout/create-template-purchase-checkout.command';
import { CreateTemplatePurchaseCheckoutHandler } from 'src/modules/marketplace/application/commands/template-purchase/create-template-purchase-checkout/create-template-purchase-checkout.handler';
import { CreateTemplatePurchaseCheckoutDto } from 'src/modules/marketplace/application/dto/template-purchase/create-template-purchase-checkout.dto';
import { CreateTemplatePurchaseCommand } from '../../../application/commands/template-purchase/create-template-purchase/create-template-purchase.command';
import { CreateTemplatePurchaseHandler } from '../../../application/commands/template-purchase/create-template-purchase/create-template-purchase.handler';
import { CreateTemplatePurchaseResponseDto } from '../../../application/dto/template-purchase/create-template-purchase.response.dto';
import { GetTemplatePurchaseHandler } from '../../../application/queries/template-purchase/get-template-purchase/get-template-purchase.handler';
import { GetTemplatePurchaseQuery } from '../../../application/queries/template-purchase/get-template-purchase/get-template-purchase.query';

@Controller('templates')
export class TemplatePurchaseController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.CreateTemplatePurchaseHandler)
    private readonly createTemplatePurchaseHandler: CreateTemplatePurchaseHandler,

    @Inject(
      MARKETPLACE_TYPES.applications.CreateTemplatePurchaseCheckoutHandler,
    )
    private readonly createTemplatePurchaseCheckoutHandler: CreateTemplatePurchaseCheckoutHandler,

    @Inject(MARKETPLACE_TYPES.applications.GetTemplatePurchaseHandler)
    private readonly getTemplatePurchaseHandler: GetTemplatePurchaseHandler,
  ) {}

  // Read-only status for the buyer (e.g. after returning from Stripe).
  @Get('purchases/:purchaseId')
  @ReadRateLimit()
  @ResponseMessage('Template purchase retrieved successfully')
  async findOne(
    @Param('purchaseId', ParseUUIDPipe) purchaseId: string,
    @Auth() auth: IAuth,
  ): Promise<CreateTemplatePurchaseResponseDto> {
    return this.getTemplatePurchaseHandler.execute(
      new GetTemplatePurchaseQuery(purchaseId, auth.id),
    );
  }

  @Post(':templateId/purchases')
  @WriteRateLimit()
  @ResponseMessage('Template purchase created successfully')
  async create(
    @Param('templateId') templateId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Auth() auth: IAuth,
  ): Promise<CreateTemplatePurchaseResponseDto> {
    if (
      !idempotencyKey ||
      !idempotencyKey.trim() ||
      idempotencyKey.length > 255 ||
      idempotencyKey !== idempotencyKey.trim()
    ) {
      throw new BadRequestException('Invalid Idempotency-Key');
    }

    const purchase = await this.createTemplatePurchaseHandler.execute(
      new CreateTemplatePurchaseCommand(templateId, auth.id, idempotencyKey),
    );

    return CreateTemplatePurchaseResponseDto.fromDomain(purchase);
  }

  // 2. CREATE PURCHASE CHECKOUT
  @Post('purchases/:purchaseId/checkout')
  @WriteRateLimit()
  @ResponseMessage('Template checkout created successfully')
  async createCheckout(
    @Param('purchaseId') purchaseId: string,
    @Body() body: CreateTemplatePurchaseCheckoutDto,
    @Auth() auth: IAuth,
  ) {
    return this.createTemplatePurchaseCheckoutHandler.execute(
      new CreateTemplatePurchaseCheckoutCommand(
        purchaseId,
        auth.id,
        body.provider,
      ),
    );
  }
}
