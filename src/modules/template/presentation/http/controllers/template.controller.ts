import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

import { UseTemplateCommand } from '../../../application/commands/page-template/use-template/use-template.command';
import { UseTemplateHandler } from '../../../application/commands/page-template/use-template/use-template.handler';
import { TEMPLATE_TYPES } from '../../../template.types';

import { type IAuth } from 'src/types/auth';

import { ArchivePageTemplateCommand } from 'src/modules/template/application/commands/page-template/archive-page-template/archive-page-template.command';
import { ArchivePageTemplateHandler } from 'src/modules/template/application/commands/page-template/archive-page-template/archive-page-template.handler';
import { CreatePageTemplateCommand } from 'src/modules/template/application/commands/page-template/create-page-template/create-page-template.command';
import { CreatePageTemplateHandler } from 'src/modules/template/application/commands/page-template/create-page-template/create-page-template.handler';
import { RestorePageTemplateCommand } from 'src/modules/template/application/commands/page-template/restore-page-template/restore-page-template.command';
import { RestorePageTemplateHandler } from 'src/modules/template/application/commands/page-template/restore-page-template/restore-page-template.handler';
import { UpdatePageTemplateCommand } from 'src/modules/template/application/commands/page-template/update-page-template/update-page-template.command';
import { UpdatePageTemplateHandler } from 'src/modules/template/application/commands/page-template/update-page-template/update-page-template.handler';
import { PublishTemplateVersionCommand } from 'src/modules/template/application/commands/template-version/publish-template-version/publish-template-version.command';
import { CreateTemplateVersionCommand } from 'src/modules/template/application/commands/template-version/create-template-version/create-template-version.command';
import { CreateTemplateVersionHandler } from 'src/modules/template/application/commands/template-version/create-template-version/create-template-version.handler';
import { PublishTemplateVersionHandler } from 'src/modules/template/application/commands/template-version/publish-template-version/publish-template-version.handler';
import { GetPageTemplateHandler } from 'src/modules/template/application/queries/page-template/get-page-template/get-page-template.handler';
import { GetPageTemplateQuery } from 'src/modules/template/application/queries/page-template/get-page-template/get-page-template.query';
import { ListPageTemplatesHandler } from 'src/modules/template/application/queries/page-template/list-page-templates/list-page-templates.handler';
import { ListPageTemplatesQuery } from 'src/modules/template/application/queries/page-template/list-page-templates/list-page-templates.query';
import { GetTemplatePreviewHandler } from 'src/modules/template/application/queries/template-preview/get-template-preview/get-template-preview.handler';
import { GetTemplatePreviewQuery } from 'src/modules/template/application/queries/template-preview/get-template-preview/get-template-preview.query';
import { ListTemplateVersionsHandler } from 'src/modules/template/application/queries/template-version/list-template-versions/list-template-versions.handler';
import { ListTemplateVersionsQuery } from 'src/modules/template/application/queries/template-version/list-template-versions/list-template-versions.query';
import type { ListPageTemplatesResponseDto } from '../../../application/dto/page-template/list-page-templates.response.dto';
import { CreatePageTemplateRequest } from '../requests/create-page-template.request';
import { ListPageTemplatesRequest } from '../requests/list-page-templates.request';
import { UpdatePageTemplateRequest } from '../requests/update-page-template.request';
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

    @Inject(TEMPLATE_TYPES.applications.ListPageTemplatesHandler)
    private readonly listPageTemplatesHandler: ListPageTemplatesHandler,

    @Inject(TEMPLATE_TYPES.applications.GetPageTemplateHandler)
    private readonly getPageTemplateHandler: GetPageTemplateHandler,

    @Inject(TEMPLATE_TYPES.applications.ListTemplateVersionsHandler)
    private readonly listTemplateVersionsHandler: ListTemplateVersionsHandler,

    @Inject(TEMPLATE_TYPES.applications.UpdatePageTemplateHandler)
    private readonly updatePageTemplateHandler: UpdatePageTemplateHandler,

    @Inject(TEMPLATE_TYPES.applications.ArchivePageTemplateHandler)
    private readonly archivePageTemplateHandler: ArchivePageTemplateHandler,

    @Inject(TEMPLATE_TYPES.applications.RestorePageTemplateHandler)
    private readonly restorePageTemplateHandler: RestorePageTemplateHandler,

    @Inject(TEMPLATE_TYPES.applications.CreateTemplateVersionHandler)
    private readonly createTemplateVersionHandler: CreateTemplateVersionHandler,
  ) {}

  @Post(':templateId/versions')
  @WriteRateLimit()
  @ResponseMessage('Template version created successfully')
  async createVersion(
    @Param('templateId') templateId: string,
    @Auth() auth: IAuth,
  ) {
    return this.createTemplateVersionHandler.execute(
      new CreateTemplateVersionCommand(templateId, auth.id),
    );
  }

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

  @Get()
  @ReadRateLimit()
  @ResponseMessage('Templates retrieved successfully')
  async listTemplates(
    @Query() request: ListPageTemplatesRequest,
    @Auth() auth: IAuth,
  ): Promise<ListPageTemplatesResponseDto> {
    return this.listPageTemplatesHandler.execute(
      new ListPageTemplatesQuery(
        auth.id,
        request.scope,
        request.workspaceId,
        request.search,
        request.cursor,
        request.limit,
      ),
    );
  }

  @Get(':templateId/versions')
  @ReadRateLimit()
  @ResponseMessage('Template versions retrieved successfully')
  async listVersions(
    @Param('templateId') templateId: string,
    @Auth() auth: IAuth,
  ) {
    return this.listTemplateVersionsHandler.execute(
      new ListTemplateVersionsQuery(templateId, auth.id),
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

  @Get(':templateId')
  @ReadRateLimit()
  @ResponseMessage('Template retrieved successfully')
  async getTemplate(
    @Param('templateId') templateId: string,
    @Auth() auth: IAuth,
  ) {
    return this.getPageTemplateHandler.execute(
      new GetPageTemplateQuery(templateId, auth.id),
    );
  }

  @Patch(':templateId')
  @WriteRateLimit()
  @ResponseMessage('Template updated successfully')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() body: UpdatePageTemplateRequest,
    @Auth() auth: IAuth,
  ) {
    return this.updatePageTemplateHandler.execute(
      new UpdatePageTemplateCommand(
        templateId,
        auth.id,
        body.name,
        body.description,
        body.icon,
        body.cover_url,
        body.visibility,
      ),
    );
  }

  @Post(':templateId/archive')
  @WriteRateLimit()
  @ResponseMessage('Template archived successfully')
  async archiveTemplate(
    @Param('templateId') templateId: string,
    @Auth() auth: IAuth,
  ) {
    return this.archivePageTemplateHandler.execute(
      new ArchivePageTemplateCommand(templateId, auth.id),
    );
  }

  @Post(':templateId/restore')
  @WriteRateLimit()
  @ResponseMessage('Template restored successfully')
  async restoreTemplate(
    @Param('templateId') templateId: string,
    @Auth() auth: IAuth,
  ) {
    return this.restorePageTemplateHandler.execute(
      new RestorePageTemplateCommand(templateId, auth.id),
    );
  }
}
