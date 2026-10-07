import { Injectable } from '@nestjs/common';

import { TemplatePreviewResponseDto } from '../../../dto/template-preview/template-preview.response.dto';
import { TemplatePreviewLoader } from '../../../services/template-preview-loader.service';
import { GetInternalTemplateRenderQuery } from './get-internal-template-render.query';

@Injectable()
export class GetInternalTemplateRenderHandler {
  constructor(
    private readonly templatePreviewLoader: TemplatePreviewLoader,
  ) {}

  execute(
    query: GetInternalTemplateRenderQuery,
  ): Promise<TemplatePreviewResponseDto> {
    return this.templatePreviewLoader.loadByIds(
      query.templateId,
      query.versionId,
    );
  }
}
