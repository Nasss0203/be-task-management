import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';

import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_TYPES } from '../../../admin.types';
import { ListAdminTemplatesRequestDto } from '../../../application/dto/request/list-admin-templates.request.dto';
import { AdminTemplateListResponseDto } from '../../../application/dto/response/admin-template-list.response.dto';
import type { AdminTemplatesOverview } from '../../../application/ports/admin-template-reader.port';
import { GetAdminTemplatesOverviewHandler } from '../../../application/queries/get-admin-templates-overview/get-admin-templates-overview.handler';
import { ListAdminTemplatesHandler } from '../../../application/queries/list-admin-templates/list-admin-templates.handler';
import { ListAdminTemplatesQuery } from '../../../application/queries/list-admin-templates/list-admin-templates.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';

@Controller('admin/templates')
@UseGuards(AdminPermissionGuard)
export class AdminTemplatesController {
  constructor(
    @Inject(ADMIN_TYPES.applications.GetAdminTemplatesOverviewHandler)
    private readonly getOverviewHandler: GetAdminTemplatesOverviewHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminTemplatesHandler)
    private readonly listTemplatesHandler: ListAdminTemplatesHandler,
  ) {}

  @Get('overview')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.TEMPLATES_READ)
  @ResponseMessage('Get templates overview successfully')
  getOverview(): Promise<AdminTemplatesOverview> {
    return this.getOverviewHandler.execute();
  }

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.TEMPLATES_READ)
  @ResponseMessage('Get templates successfully')
  list(
    @Query() request: ListAdminTemplatesRequestDto,
  ): Promise<AdminTemplateListResponseDto> {
    return this.listTemplatesHandler.execute(
      new ListAdminTemplatesQuery(
        request.page,
        request.limit,
        request.search,
        request.status,
        request.offerType,
        request.categoryId,
      ),
    );
  }
}
