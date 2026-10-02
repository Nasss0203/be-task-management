import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import { WriteRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

import { UseTemplateCommand } from '../../../application/commands/page-template/use-template/use-template.command';
import { UseTemplateHandler } from '../../../application/commands/page-template/use-template/use-template.handler';
import { TEMPLATE_TYPES } from '../../../template.types';

import { type IAuth } from 'src/types/auth';

import { CreatePageTemplateCommand } from 'src/modules/template/application/commands/page-template/create-page-template/create-page-template.command';
import { CreatePageTemplateHandler } from 'src/modules/template/application/commands/page-template/create-page-template/create-page-template.handler';
import { PublishTemplateVersionCommand } from 'src/modules/template/application/commands/template-version/publish-template-version/publish-template-version.command';
import { PublishTemplateVersionHandler } from 'src/modules/template/application/commands/template-version/publish-template-version/publish-template-version.handler';
import { GetTemplatePreviewHandler } from 'src/modules/template/application/queries/template-preview/get-template-preview/get-template-preview.handler';
import { GetTemplatePreviewQuery } from 'src/modules/template/application/queries/template-preview/get-template-preview/get-template-preview.query';
import { CreatePageTemplateRequest } from '../requests/create-page-template.request';
import { UseTemplateRequest } from '../requests/use-template.request';

@Controller('templates')
export class TemplateController {
  constructor(
    @Inject(TEMPLATE_TYPES.applications.UseTemplateHandler)
    private readonly useTemplateHandler: UseTemplateHandler,

    @Inject(TEMPLATE_TYPES.applications.CreatePageTemplateHandler)
    private readonly createPageTemplateHandler: CreatePageTemplateHandler,

    @Inject(TEMPLATE_TYPES.applications.PublishTemplateVersionHandler)
    private readonly publishTemplateVersionHandler: PublishTemplateVersionHandler,

    @Inject(TEMPLATE_TYPES.applications.GetTemplatePreviewHandler)
    private readonly getTemplatePreviewHandler: GetTemplatePreviewHandler,
  ) {}

  @Post(':templateId/versions/:versionId/use')
  @WriteRateLimit()
  @ResponseMessage('Use template')
  async useTemplate(
    @Param('templateId') templateId: string,
    @Param('versionId') versionId: string,
    @Body() body: UseTemplateRequest,
    @Auth() auth: IAuth,
  ) {
    return this.useTemplateHandler.execute(
      new UseTemplateCommand(templateId, versionId, body.workspace_id, auth.id),
    );
  }

  @Post('from-page/:pageId')
  @WriteRateLimit()
  @ResponseMessage('Create template')
  async createTemplate(
    @Body() body: CreatePageTemplateRequest,
    @Param('pageId') pageId: string,
    @Auth() auth: IAuth,
  ) {
    return this.createPageTemplateHandler.execute(
      new CreatePageTemplateCommand(
        pageId,
        auth.id,
        body.name,
        body.description,
        body.icon,
        body.cover_url,
        body.visibility,
      ),
    );
  }

  @Post(':templateId/versions/:versionId/publish')
  @WriteRateLimit()
  @ResponseMessage('Publish template version')
  async publishVersion(
    @Param('templateId') templateId: string,
    @Param('versionId') versionId: string,
    @Auth() auth: IAuth,
  ) {
    return this.publishTemplateVersionHandler.execute(
      new PublishTemplateVersionCommand(templateId, versionId, auth.id),
    );
  }

  @Get(':templateId/versions/:versionId/preview')
  @ResponseMessage('Get template preview')
  async getPreview(
    @Param('templateId') templateId: string,
    @Param('versionId') versionId: string,
    @Auth() auth: IAuth,
  ) {
    return this.getTemplatePreviewHandler.execute(
      new GetTemplatePreviewQuery(templateId, versionId, auth.id),
    );
  }
}
