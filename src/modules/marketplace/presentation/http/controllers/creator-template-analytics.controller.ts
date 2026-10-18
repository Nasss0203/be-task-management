import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import { ReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import type { IAuth } from 'src/types/auth';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import type {
  CreatorTemplateAnalyticsListResponseDto,
  CreatorTemplateAnalyticsResponseDto,
} from '../../../application/dto/template-analytics/template-analytics.response.dto';
import { GetCreatorTemplateAnalyticsHandler } from '../../../application/queries/template-analytics/get-creator-template-analytics/get-creator-template-analytics.handler';
import { GetCreatorTemplateAnalyticsQuery } from '../../../application/queries/template-analytics/get-creator-template-analytics/get-creator-template-analytics.query';
import { ListCreatorTemplateAnalyticsHandler } from '../../../application/queries/template-analytics/list-creator-template-analytics/list-creator-template-analytics.handler';
import { ListCreatorTemplateAnalyticsQuery } from '../../../application/queries/template-analytics/list-creator-template-analytics/list-creator-template-analytics.query';
import { TemplateAnalyticsRangeRequest } from '../requests/template-analytics-range.request';

@Controller('templates')
export class CreatorTemplateAnalyticsController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.ListCreatorTemplateAnalyticsHandler)
    private readonly listHandler: ListCreatorTemplateAnalyticsHandler,

    @Inject(MARKETPLACE_TYPES.applications.GetCreatorTemplateAnalyticsHandler)
    private readonly getHandler: GetCreatorTemplateAnalyticsHandler,
  ) {}

  // Declared before :templateId/analytics so "me" is never parsed as a template ID.
  @Get('me/analytics')
  @ReadRateLimit()
  @ResponseMessage('Template analytics retrieved successfully')
  async listMine(
    @Query() request: TemplateAnalyticsRangeRequest,
    @Auth() auth: IAuth,
  ): Promise<CreatorTemplateAnalyticsListResponseDto> {
    return this.listHandler.execute(
      new ListCreatorTemplateAnalyticsQuery(auth.id, request.from, request.to),
    );
  }

  @Get(':templateId/analytics')
  @ReadRateLimit()
  @ResponseMessage('Template analytics retrieved successfully')
  async getOne(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Query() request: TemplateAnalyticsRangeRequest,
    @Auth() auth: IAuth,
  ): Promise<CreatorTemplateAnalyticsResponseDto> {
    return this.getHandler.execute(
      new GetCreatorTemplateAnalyticsQuery(
        auth.id,
        templateId,
        request.from,
        request.to,
      ),
    );
  }
}
