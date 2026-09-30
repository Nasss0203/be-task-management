import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Inject,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  StrictWriteRateLimit,
  ReadRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { IAuth } from 'src/types/auth';
import { PublishPageToSiteHandler } from '../../../application/commands/page-publication/publish-page-to-site/publish-page-to-site.handler';
import { PublishPageToSiteCommand } from '../../../application/commands/page-publication/publish-page-to-site/publish-page-to-site.command';
import { ListSitePublicationsHandler } from '../../../application/queries/page-publication/list-site-publications/list-site-publications.handler';
import { PublishPageToSiteDto } from '../../../application/dto/page-publication/publish-page-to-site.dto';

@Controller('published-sites')
export class PublishedSitesController {
  constructor(
    @Inject(PublishPageToSiteHandler)
    private readonly publishHandler: PublishPageToSiteHandler,
    @Inject(ListSitePublicationsHandler)
    private readonly listHandler: ListSitePublicationsHandler,
  ) {}
  @Post(':siteId/publications')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'page_id' })
  @RequirePermissions(PERMISSIONS.PAGE_UPDATE)
  publish(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: PublishPageToSiteDto,
    @Auth() auth: IAuth,
  ) {
    return this.publishHandler.execute(
      new PublishPageToSiteCommand(
        auth.id,
        siteId,
        dto.page_id,
        dto.path,
        dto.include_descendants,
      ),
    );
  }
  @Get(':siteId/publications')
  @ReadRateLimit()
  list(@Param('siteId', ParseUUIDPipe) siteId: string, @Auth() auth: IAuth) {
    return this.listHandler.execute(siteId, auth.id);
  }
}
