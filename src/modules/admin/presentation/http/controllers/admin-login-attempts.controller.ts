import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';

import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_TYPES } from '../../../admin.types';
import { ListAdminLoginAttemptsRequestDto } from '../../../application/dto/request/list-admin-login-attempts.request.dto';
import { AdminLoginAttemptListResponseDto } from '../../../application/dto/response/admin-login-attempt-list.response.dto';
import { ListAdminLoginAttemptsHandler } from '../../../application/queries/list-admin-login-attempts/list-admin-login-attempts.handler';
import { ListAdminLoginAttemptsQuery } from '../../../application/queries/list-admin-login-attempts/list-admin-login-attempts.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';

@Controller('admin/login-attempts')
@UseGuards(AdminPermissionGuard)
export class AdminLoginAttemptsController {
  constructor(
    @Inject(ADMIN_TYPES.applications.ListAdminLoginAttemptsHandler)
    private readonly listLoginAttemptsHandler: ListAdminLoginAttemptsHandler,
  ) {}

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.AUDIT_READ)
  @ResponseMessage('Get login attempts successfully')
  list(
    @Query() request: ListAdminLoginAttemptsRequestDto,
  ): Promise<AdminLoginAttemptListResponseDto> {
    return this.listLoginAttemptsHandler.execute(
      new ListAdminLoginAttemptsQuery(
        request.page,
        request.limit,
        request.result,
        request.method,
        request.search,
      ),
    );
  }
}
