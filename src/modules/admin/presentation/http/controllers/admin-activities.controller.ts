import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';

import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_TYPES } from '../../../admin.types';
import { ListAdminActivitiesRequestDto } from '../../../application/dto/request/list-admin-activities.request.dto';
import { AdminActivityListResponseDto } from '../../../application/dto/response/admin-activity-list.response.dto';
import { ListAdminActivitiesHandler } from '../../../application/queries/list-admin-activities/list-admin-activities.handler';
import { ListAdminActivitiesQuery } from '../../../application/queries/list-admin-activities/list-admin-activities.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';

@Controller('admin/activities')
@UseGuards(AdminPermissionGuard)
export class AdminActivitiesController {
  constructor(
    @Inject(ADMIN_TYPES.applications.ListAdminActivitiesHandler)
    private readonly listActivitiesHandler: ListAdminActivitiesHandler,
  ) {}

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.AUDIT_READ)
  @ResponseMessage('Get activities successfully')
  list(
    @Query() request: ListAdminActivitiesRequestDto,
  ): Promise<AdminActivityListResponseDto> {
    return this.listActivitiesHandler.execute(
      new ListAdminActivitiesQuery(request.page, request.limit, {
        from: request.from,
        to: request.to,
        workspaceId: request.workspaceId,
        actorId: request.actorId,
        search: request.search,
        entityType: request.entityType,
        action: request.action,
      }),
    );
  }
}
