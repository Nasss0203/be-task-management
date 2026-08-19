import { Controller, Get, Param, Inject } from '@nestjs/common';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import {
  FindPageTemplateQuery,
  FindPageTemplateHandler,
} from 'src/modules/content/application/queries/page-template/find-page-template.handler';
import { PageTemplateResponseDto } from 'src/modules/content/application/dto/page-template/response/page-template.response.dto';

@Controller('page-templates')
@PublicReadRateLimit()
export class PageTemplatesController {
  constructor(
    @Inject(CONTENT_TYPES.applications.FindPageTemplateHandler)
    private readonly findPageTemplateHandler: FindPageTemplateHandler,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PageTemplateResponseDto> {
    return this.findPageTemplateHandler.execute(new FindPageTemplateQuery(id));
  }
}
