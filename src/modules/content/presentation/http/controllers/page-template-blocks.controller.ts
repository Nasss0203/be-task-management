import { Controller, Get, Param, Inject } from '@nestjs/common';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import {
  FindPageTemplateBlockByTemplateQuery,
  FindPageTemplateBlockHandler,
} from 'src/modules/content/application/queries/page-template/find-page-template-block.handler';
import { PageTemplateBlockResponseDto } from 'src/modules/content/application/dto/page-template/response/page-template-block.response.dto';

@Controller('page-template-blocks')
@PublicReadRateLimit()
export class PageTemplateBlocksController {
  constructor(
    @Inject(CONTENT_TYPES.applications.FindPageTemplateBlockHandler)
    private readonly findPageTemplateBlockHandler: FindPageTemplateBlockHandler,
  ) {}

  @Get('template/:templateId')
  async findByTemplateId(
    @Param('templateId') templateId: string,
  ): Promise<PageTemplateBlockResponseDto[]> {
    return this.findPageTemplateBlockHandler.execute(
      new FindPageTemplateBlockByTemplateQuery(templateId),
    );
  }
}
