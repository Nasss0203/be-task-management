import { Controller, Get, Inject, Param, Query } from '@nestjs/common';

import { Public } from 'src/common/decorator/public.decorator';
import { ReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

import { GetPublicTemplatePreviewHandler } from '../../../application/queries/template-preview/get-public-template-preview/get-public-template-preview.handler';
import { GetPublicTemplatePreviewQuery } from '../../../application/queries/template-preview/get-public-template-preview/get-public-template-preview.query';
import { ListPublicTemplatesHandler } from '../../../application/queries/page-template/list-public-templates/list-public-templates.handler';
import { ListPublicTemplatesQuery } from '../../../application/queries/page-template/list-public-templates/list-public-templates.query';
import { ListPublicTemplatesRequest } from '../requests/list-public-templates.request';
import { TEMPLATE_TYPES } from '../../../template.types';

@Controller('public/templates')
export class PublicTemplateController {
  constructor(
    @Inject(TEMPLATE_TYPES.applications.ListPublicTemplatesHandler)
    private readonly listPublicTemplatesHandler: ListPublicTemplatesHandler,
    @Inject(TEMPLATE_TYPES.applications.GetPublicTemplatePreviewHandler)
    private readonly getPublicTemplatePreviewHandler: GetPublicTemplatePreviewHandler,
  ) {}

  @Public()
  @Get()
  @ReadRateLimit()
  @ResponseMessage('Public templates retrieved successfully')
  async list(@Query() query: ListPublicTemplatesRequest) {
    return this.listPublicTemplatesHandler.execute(
      new ListPublicTemplatesQuery(query.search, query.cursor, query.limit),
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
}
