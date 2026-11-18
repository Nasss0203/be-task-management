import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';

import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_TYPES } from '../../../admin.types';
import { ListAdminActionsRequestDto } from '../../../application/dto/request/list-admin-actions.request.dto';
import { AdminActionListResponseDto } from '../../../application/dto/response/admin-action-list.response.dto';
import { ListAdminActionsHandler } from '../../../application/queries/list-admin-actions/list-admin-actions.handler';
import { ListAdminActionsQuery } from '../../../application/queries/list-admin-actions/list-admin-actions.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';

@Controller('admin/audit/actions')
@UseGuards(AdminPermissionGuard)
export class AdminActionsController {
  constructor(
    @Inject(ADMIN_TYPES.applications.ListAdminActionsHandler)
    private readonly listActionsHandler: ListAdminActionsHandler,
  ) {}

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.AUDIT_READ)
  @ResponseMessage('Get admin actions successfully')
  list(
    @Query() request: ListAdminActionsRequestDto,
  ): Promise<AdminActionListResponseDto> {
    return this.listActionsHandler.execute(
      new ListAdminActionsQuery(request.page, request.limit, {
        from: request.from,
        to: request.to,
        actorId: request.actorId,
        targetType: request.targetType,
        targetId: request.targetId,
        action: request.action,
        search: request.search,
      }),
    );
  }
}
