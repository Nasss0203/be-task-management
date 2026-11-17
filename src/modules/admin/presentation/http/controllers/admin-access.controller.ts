import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import type { IUserJwtPayload } from 'src/modules/identity/identity-jwt.types';
import { SystemRole } from 'src/modules/identity/identity.types';
import { ADMIN_TYPES } from '../../../admin.types';
import {
  AdminAccessResponseDto,
  AdminAccessRoleResponseDto,
} from '../../../application/dto/response/admin-access.response.dto';
import { GetAdminAccessHandler } from '../../../application/queries/get-admin-access/get-admin-access.handler';
import { GetAdminAccessQuery } from '../../../application/queries/get-admin-access/get-admin-access.query';
import { ListAdminAccessRolesHandler } from '../../../application/queries/list-admin-access-roles/list-admin-access-roles.handler';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';

@Controller('admin/access')
@UseGuards(AdminPermissionGuard)
export class AdminAccessController {
  constructor(
    @Inject(ADMIN_TYPES.applications.GetAdminAccessHandler)
    private readonly getAdminAccessHandler: GetAdminAccessHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminAccessRolesHandler)
    private readonly listAdminAccessRolesHandler: ListAdminAccessRolesHandler,
  ) {}

  @Get('me')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.ACCESS_READ)
  @ResponseMessage('Get admin access successfully')
  getMyAccess(@Auth() user: IUserJwtPayload): AdminAccessResponseDto {
    return this.getAdminAccessHandler.execute(
      new GetAdminAccessQuery(user.id, user.systemRole),
    );
  }

  @Get('roles')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.ACCESS_READ)
  @ResponseMessage('Get admin access roles successfully')
  listRoles(): AdminAccessRoleResponseDto[] {
    return this.listAdminAccessRolesHandler.execute();
  }
}
