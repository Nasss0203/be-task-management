import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { ListWorkspacePublishedSitesHandler } from '../../../application/queries/page-publication/list-workspace-published-sites/list-workspace-published-sites.handler';
import { ListWorkspacePublishedSitesQuery } from '../../../application/queries/page-publication/list-workspace-published-sites/list-workspace-published-sites.query';

@Controller('workspaces')
@ReadRateLimit()
export class WorkspacePublishedSitesController {
  constructor(
    private readonly listHandler: ListWorkspacePublishedSitesHandler,
  ) {}

  @Get(':workspaceId/published-sites')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ResponseMessage('List published sites by workspace')
  list(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.listHandler.execute(
      new ListWorkspacePublishedSitesQuery(workspaceId),
    );
  }
}
