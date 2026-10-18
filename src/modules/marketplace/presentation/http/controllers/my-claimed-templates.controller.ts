import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { Controller, Get, Inject, Query } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import type { IAuth } from 'src/types/auth';
import { GetMyClaimedTemplatesHandler } from '../../../application/queries/template-entitlement/get-my-claimed-templates/get-my-claimed-templates.handler';
import { GetMyClaimedTemplatesQuery } from '../../../application/queries/template-entitlement/get-my-claimed-templates/get-my-claimed-templates.query';
import type { MyClaimedTemplatesResponseDto } from '../../../application/dto/template-entitlement/my-claimed-templates.response.dto';
import { GetMyClaimedTemplatesRequest } from '../requests/get-my-claimed-templates.request';

@Controller('templates/me/claimed')
export class MyClaimedTemplatesController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.GetMyClaimedTemplatesHandler)
    private readonly handler: GetMyClaimedTemplatesHandler,
  ) {}

  @Get()
  @ReadRateLimit()
  @ResponseMessage('Claimed templates retrieved successfully')
  async list(
    @Query() request: GetMyClaimedTemplatesRequest,
    @Auth() auth: IAuth,
  ): Promise<MyClaimedTemplatesResponseDto> {
    return this.handler.execute(
      new GetMyClaimedTemplatesQuery(
        auth.id,
        request.cursor,
        request.limit,
        request.source,
      ),
    );
  }
}
