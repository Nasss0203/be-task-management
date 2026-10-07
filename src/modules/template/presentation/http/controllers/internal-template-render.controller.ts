import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Public } from '../../../../../common/decorator/public.decorator';

import { InternalTemplateRenderGuard } from 'src/common/guard/internal-template-render.guard';
import { GenerateTemplateVersionThumbnailCommand } from 'src/modules/template/application/commands/generate-template-version-thumbnail/generate-template-version-thumbnail.command';
import { GenerateTemplateVersionThumbnailHandler } from 'src/modules/template/application/commands/generate-template-version-thumbnail/generate-template-version-thumbnail.handler';
import { GetTemplateVersionThumbnailHandler } from 'src/modules/template/application/queries/template-version/get-template-version-thumbnail/get-template-version-thumbnail.handler';
import { GetTemplateVersionThumbnailQuery } from 'src/modules/template/application/queries/template-version/get-template-version-thumbnail/get-template-version-thumbnail.query';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { GetInternalTemplateRenderHandler } from '../../../application/queries/internal-template-render/get-internal-template-render/get-internal-template-render.handler';
import { GetInternalTemplateRenderQuery } from '../../../application/queries/internal-template-render/get-internal-template-render/get-internal-template-render.query';

@Controller('internal/templates')
export class InternalTemplateRenderController {
  constructor(
    @Inject(TEMPLATE_TYPES.applications.GetInternalTemplateRenderHandler)
    private readonly getInternalTemplateRenderHandler: GetInternalTemplateRenderHandler,

    @Inject(TEMPLATE_TYPES.applications.GenerateTemplateVersionThumbnailHandler)
    private readonly generateTemplateVersionThumbnailHandler: GenerateTemplateVersionThumbnailHandler,

    @Inject(TEMPLATE_TYPES.applications.GetTemplateVersionThumbnailHandler)
    private readonly getTemplateVersionThumbnailHandler: GetTemplateVersionThumbnailHandler,
  ) {}

  @Public()
  @UseGuards(InternalTemplateRenderGuard)
  @Get(':templateId/versions/:versionId/preview')
  async getPreview(
    @Param('templateId') templateId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.getInternalTemplateRenderHandler.execute(
      new GetInternalTemplateRenderQuery(templateId, versionId),
    );
  }

  @Public()
  @UseGuards(InternalTemplateRenderGuard)
  @Post(':templateId/versions/:versionId/thumbnail')
  async generateThumbnail(
    @Param('templateId') templateId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.generateTemplateVersionThumbnailHandler.execute(
      new GenerateTemplateVersionThumbnailCommand(templateId, versionId),
    );
  }

  @Public()
  @Get(':templateId/versions/:versionId/thumbnail')
  async getVersionThumbnail(
    @Param('templateId') templateId: string,
    @Param('versionId') versionId: string,
    @Req()
    request: Request & {
      user?: {
        id?: string;
      };
    },
  ) {
    return this.getTemplateVersionThumbnailHandler.execute(
      new GetTemplateVersionThumbnailQuery(
        templateId,
        versionId,
        request.user?.id,
      ),
    );
  }
}
