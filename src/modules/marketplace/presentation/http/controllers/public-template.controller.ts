import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

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
import { ListTemplateReviewsRequest } from '../requests/list-template-reviews.request';
import { ListPublicTemplateReviewsHandler } from '../../../application/queries/template-feedback/list-public-template-reviews/list-public-template-reviews.handler';
import { ListPublicTemplateReviewsQuery } from '../../../application/queries/template-feedback/list-public-template-reviews/list-public-template-reviews.query';
import type { TemplateReviewsResponseDto } from '../../../application/dto/template-feedback/template-feedback.response.dto';

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

    @Inject(MARKETPLACE_TYPES.applications.ListPublicTemplateReviewsHandler)
    private readonly listReviewsHandler: ListPublicTemplateReviewsHandler,
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
        query.sort,
        query.creator,
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

  @Public()
  @Get(':templateId/reviews')
  @ReadRateLimit()
  @ResponseMessage('Template reviews retrieved successfully')
  async listReviews(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Query() query: ListTemplateReviewsRequest,
    @Auth() auth: IAuth | null,
  ): Promise<TemplateReviewsResponseDto> {
    return this.listReviewsHandler.execute(
      new ListPublicTemplateReviewsQuery(
        templateId,
        query.page,
        query.limit,
        auth?.id ?? null,
      ),
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
