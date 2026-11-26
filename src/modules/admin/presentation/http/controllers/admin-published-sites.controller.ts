import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { Auth } from 'src/common/decorator/auth.decorator';

import {
  AdminRateLimit,
  StrictWriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import type { IUserJwtPayload } from 'src/modules/identity/identity-jwt.types';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_TYPES } from '../../../admin.types';
import { DisableAdminPublishedSiteCommand } from '../../../application/commands/disable-admin-published-site/disable-admin-published-site.command';
import { DisableAdminPublishedSiteHandler } from '../../../application/commands/disable-admin-published-site/disable-admin-published-site.handler';
import { RestoreAdminPublishedSiteCommand } from '../../../application/commands/restore-admin-published-site/restore-admin-published-site.command';
import { RestoreAdminPublishedSiteHandler } from '../../../application/commands/restore-admin-published-site/restore-admin-published-site.handler';
import { DisableAdminPublishedSiteRequestDto } from '../../../application/dto/request/disable-admin-published-site.request.dto';
import { ListAdminPublishedSitesRequestDto } from '../../../application/dto/request/list-admin-published-sites.request.dto';
import { AdminPublishedSiteListResponseDto } from '../../../application/dto/response/admin-published-site-list.response.dto';
import type { AdminPublishedSitesOverview } from '../../../application/ports/admin-published-site-reader.port';
import type { AdminPublishedSiteModerationResult } from '../../../application/ports/admin-published-site-writer.port';
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
import { adminRequestClientOf } from '../admin-request-client';

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

    @Inject(ADMIN_TYPES.applications.DisableAdminPublishedSiteHandler)
    private readonly disableSiteHandler: DisableAdminPublishedSiteHandler,

    @Inject(ADMIN_TYPES.applications.RestoreAdminPublishedSiteHandler)
    private readonly restoreSiteHandler: RestoreAdminPublishedSiteHandler,
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

  @Post(':siteId/disable')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SITES_MODERATE)
  @ResponseMessage('Disable published site successfully')
  disableSite(
    @Auth() actor: IUserJwtPayload,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: DisableAdminPublishedSiteRequestDto,
    @Req() req: Request,
  ): Promise<AdminPublishedSiteModerationResult> {
    return this.disableSiteHandler.execute(
      new DisableAdminPublishedSiteCommand(
        actor.id,
        siteId,
        dto.reason,
        adminRequestClientOf(req),
      ),
    );
  }

  @Post(':siteId/restore')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SITES_MODERATE)
  @ResponseMessage('Restore published site successfully')
  restoreSite(
    @Auth() actor: IUserJwtPayload,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Req() req: Request,
  ): Promise<AdminPublishedSiteModerationResult> {
    return this.restoreSiteHandler.execute(
      new RestoreAdminPublishedSiteCommand(
        actor.id,
        siteId,
        adminRequestClientOf(req),
      ),
    );
  }
}
