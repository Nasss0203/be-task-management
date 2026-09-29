import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import { StrictWriteRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';

import { PublishSiteCommand } from 'src/modules/content/application/commands/page-publication/publish-site/publish-site.command';
import { PublishSiteHandler } from 'src/modules/content/application/commands/page-publication/publish-site/publish-site.handler';
import { RepublishSiteCommand } from 'src/modules/content/application/commands/page-publication/republish-site/republish-site.command';
import { RepublishSiteHandler } from 'src/modules/content/application/commands/page-publication/republish-site/republish-site.handler';
import { UnpublishSiteCommand } from 'src/modules/content/application/commands/page-publication/unpublish-site/unpublish-site.command';
import { UnpublishSiteHandler } from 'src/modules/content/application/commands/page-publication/unpublish-site/unpublish-site.handler';
import { PublishSiteDto } from 'src/modules/content/application/dto/page-publication/publish-site.dto';
import { GetPagePublicationHandler } from 'src/modules/content/application/queries/page-publication/get-page-publication/get-page-publication.handler';
import { GetPagePublicationQuery } from 'src/modules/content/application/queries/page-publication/get-page-publication/get-page-publication.query';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { IAuth } from 'src/types/auth';

@Controller('page')
export class PagePublicationController {
  constructor(
    @Inject(CONTENT_TYPES.applications.PublishSiteHandler)
    private readonly publishSiteHandler: PublishSiteHandler,

    @Inject(CONTENT_TYPES.applications.GetPagePublicationHandler)
    private readonly getPagePublicationHandler: GetPagePublicationHandler,

    @Inject(CONTENT_TYPES.applications.UnpublishSiteHandler)
    private readonly unpublishSiteHandler: UnpublishSiteHandler,

    @Inject(CONTENT_TYPES.applications.RepublishSiteHandler)
    private readonly republishSiteHandler: RepublishSiteHandler,
  ) {}

  @Post(':pageId/publication')
  @StrictWriteRateLimit()
  @WorkspaceContext({
    source: 'resource',
    type: 'page',
    key: 'pageId',
  })
  @RequirePermissions(PERMISSIONS.PAGE_UPDATE)
  @ResponseMessage('Publish page')
  publish(
    @Param('pageId') pageId: string,
    @Body() dto: PublishSiteDto,
    @Auth() auth: IAuth,
  ) {
    return this.publishSiteHandler.execute(
      new PublishSiteCommand(auth.id, pageId, dto.subdomain),
    );
  }

  @Get(':pageId/publication')
  @WorkspaceContext({
    source: 'resource',
    type: 'page',
    key: 'pageId',
  })
  @RequirePermissions(PERMISSIONS.PAGE_UPDATE)
  @ResponseMessage('Get page publication')
  getPublication(
    @Param('pageId') pageId: string,
    @Query('site_id') siteId?: string,
  ) {
    return this.getPagePublicationHandler.execute(
      new GetPagePublicationQuery(pageId, siteId),
    );
  }

  @Delete(':pageId/publication')
  @StrictWriteRateLimit()
  @WorkspaceContext({
    source: 'resource',
    type: 'page',
    key: 'pageId',
  })
  @RequirePermissions(PERMISSIONS.PAGE_UPDATE)
  @ResponseMessage('Unpublish page')
  unpublish(
    @Param('pageId') pageId: string,
    @Auth() auth: IAuth,
    @Query('site_id') siteId?: string,
  ) {
    return this.unpublishSiteHandler.execute(
      new UnpublishSiteCommand(auth.id, pageId, siteId),
    );
  }

  @Post(':pageId/publication/republish')
  @StrictWriteRateLimit()
  @WorkspaceContext({
    source: 'resource',
    type: 'page',
    key: 'pageId',
  })
  @RequirePermissions(PERMISSIONS.PAGE_UPDATE)
  @ResponseMessage('Republish page')
  republish(
    @Param('pageId') pageId: string,
    @Auth() auth: IAuth,
    @Query('site_id') siteId?: string,
  ) {
    return this.republishSiteHandler.execute(
      new RepublishSiteCommand(auth.id, pageId, siteId),
    );
  }
}
