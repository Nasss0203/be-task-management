import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_TYPES } from '../../../admin.types';
import { ListAdminPublishedSitesRequestDto } from '../../../application/dto/request/list-admin-published-sites.request.dto';
import { AdminPublishedSiteListResponseDto } from '../../../application/dto/response/admin-published-site-list.response.dto';
import type { AdminPublishedSitesOverview } from '../../../application/ports/admin-published-site-reader.port';
import {
  type AdminPublishedSiteDetailResponse,
  GetAdminPublishedSiteHandler,
} from '../../../application/queries/get-admin-published-site/get-admin-published-site.handler';
import { GetAdminPublishedSitesOverviewHandler } from '../../../application/queries/get-admin-published-sites-overview/get-admin-published-sites-overview.handler';
import { ListAdminPublishedSitesHandler } from '../../../application/queries/list-admin-published-sites/list-admin-published-sites.handler';
import { ListAdminPublishedSitesQuery } from '../../../application/queries/list-admin-published-sites/list-admin-published-sites.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';

@Controller('admin/published-sites')
@UseGuards(AdminPermissionGuard)
export class AdminPublishedSitesController {
  constructor(
    @Inject(ADMIN_TYPES.applications.GetAdminPublishedSitesOverviewHandler)
    private readonly getOverviewHandler: GetAdminPublishedSitesOverviewHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminPublishedSitesHandler)
    private readonly listSitesHandler: ListAdminPublishedSitesHandler,

    @Inject(ADMIN_TYPES.applications.GetAdminPublishedSiteHandler)
    private readonly getSiteHandler: GetAdminPublishedSiteHandler,
  ) {}

  @Get('overview')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SITES_READ)
  @ResponseMessage('Get published sites overview successfully')
  getOverview(): Promise<AdminPublishedSitesOverview> {
    return this.getOverviewHandler.execute();
  }

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SITES_READ)
  @ResponseMessage('Get published sites successfully')
  list(
    @Query() request: ListAdminPublishedSitesRequestDto,
  ): Promise<AdminPublishedSiteListResponseDto> {
    return this.listSitesHandler.execute(
      new ListAdminPublishedSitesQuery(
        request.page,
        request.limit,
        request.search,
        request.status,
      ),
    );
  }

  @Get(':siteId')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SITES_READ)
  @ResponseMessage('Get published site successfully')
  getSite(
    @Param('siteId', ParseUUIDPipe) siteId: string,
  ): Promise<AdminPublishedSiteDetailResponse> {
    return this.getSiteHandler.execute(siteId);
  }
}
