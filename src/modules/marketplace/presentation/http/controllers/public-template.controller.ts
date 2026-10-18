import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import {
  PublicReadRateLimit,
  ReadRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import type { IAuth } from 'src/types/auth';

import { GetPublicTemplateDetailHandler } from 'src/modules/marketplace/application/queries/template-preview/get-public-template-detail/get-public-template-detail.handler';
import { GetPublicTemplateDetailQuery } from 'src/modules/marketplace/application/queries/template-preview/get-public-template-detail/get-public-template-detail.query';
import { RecordTemplateViewCommand } from '../../../application/commands/template-analytics/record-template-view/record-template-view.command';
import { RecordTemplateViewHandler } from '../../../application/commands/template-analytics/record-template-view/record-template-view.handler';
import { ListPublicTemplatesHandler } from '../../../application/queries/page-template/list-public-templates/list-public-templates.handler';
import { ListPublicTemplatesQuery } from '../../../application/queries/page-template/list-public-templates/list-public-templates.query';
import { GetPublicTemplatePreviewHandler } from '../../../application/queries/template-preview/get-public-template-preview/get-public-template-preview.handler';
import { GetPublicTemplatePreviewQuery } from '../../../application/queries/template-preview/get-public-template-preview/get-public-template-preview.query';
import { ListPublicTemplatesRequest } from '../requests/list-public-templates.request';

@Controller('public/templates')
export class PublicTemplateController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.ListPublicTemplatesHandler)
    private readonly listPublicTemplatesHandler: ListPublicTemplatesHandler,

    @Inject(MARKETPLACE_TYPES.applications.GetPublicTemplatePreviewHandler)
    private readonly getPublicTemplatePreviewHandler: GetPublicTemplatePreviewHandler,

    @Inject(MARKETPLACE_TYPES.applications.GetPublicTemplateDetailHandler)
    private readonly getPublicTemplateDetailHandler: GetPublicTemplateDetailHandler,

    @Inject(MARKETPLACE_TYPES.applications.RecordTemplateViewHandler)
    private readonly recordTemplateViewHandler: RecordTemplateViewHandler,
  ) {}

  @Public()
  @Get()
  @ReadRateLimit()
  @ResponseMessage('Public templates retrieved successfully')
  async list(@Query() query: ListPublicTemplatesRequest) {
    return this.listPublicTemplatesHandler.execute(
      new ListPublicTemplatesQuery(
        query.search,
        query.cursor,
        query.limit,
        query.category,
        query.tag,
        query.offer_type,
      ),
    );
  }

  @Public()
  @Get(':templateId/versions/:versionId/preview')
  @ReadRateLimit()
  @ResponseMessage('Public template preview retrieved successfully')
  async getPreview(
    @Param('templateId') templateId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.getPublicTemplatePreviewHandler.execute(
      new GetPublicTemplatePreviewQuery(templateId, versionId),
    );
  }

  @Public()
  @Get(':templateId')
  @ReadRateLimit()
  async getDetail(@Param('templateId') templateId: string) {
    return this.getPublicTemplateDetailHandler.execute(
      new GetPublicTemplateDetailQuery(templateId),
    );
  }

  // POST, not part of GET detail: prefetch, refetch and crawlers must not count as views.
  @Public()
  @Post(':templateId/views')
  @PublicReadRateLimit()
  @ResponseMessage('Template view recorded')
  async recordView(
    @Param('templateId') templateId: string,
    @Auth() auth: IAuth | null,
  ): Promise<void> {
    await this.recordTemplateViewHandler.execute(
      new RecordTemplateViewCommand(templateId, auth?.id ?? null),
    );
  }
}
