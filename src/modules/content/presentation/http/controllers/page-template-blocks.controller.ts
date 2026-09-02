import { Controller, Get, Param, Inject } from '@nestjs/common';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { FindPageTemplateBlockByTemplateHandler } from 'src/modules/content/application/queries/page-template/find-page-template-block-by-template/find-page-template-block-by-template.handler';
import { FindPageTemplateBlockByTemplateQuery } from 'src/modules/content/application/queries/page-template/find-page-template-block-by-template/find-page-template-block-by-template.query';
import { PageTemplateBlockResponseDto } from 'src/modules/content/application/dto/page-template/response/page-template-block.response.dto';

@Controller('page-template-blocks')
@PublicReadRateLimit()
export class PageTemplateBlocksController {
  constructor(
    @Inject(CONTENT_TYPES.applications.FindPageTemplateBlockByTemplateHandler)
    private readonly findPageTemplateBlockByTemplateHandler: FindPageTemplateBlockByTemplateHandler,
  ) {}

  @Get('template/:templateId')
  async findByTemplateId(
    @Param('templateId') templateId: string,
  ): Promise<PageTemplateBlockResponseDto[]> {
    return this.findPageTemplateBlockByTemplateHandler.execute(
      new FindPageTemplateBlockByTemplateQuery(templateId),
    );
  }
}
