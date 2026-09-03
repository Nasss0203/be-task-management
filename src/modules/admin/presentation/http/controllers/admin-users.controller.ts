import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { UpdateAdminUserStatusCommand } from '../../../application/commands/update-admin-user-status/update-admin-user-status.command';
import { UpdateAdminUserStatusHandler } from '../../../application/commands/update-admin-user-status/update-admin-user-status.handler';
import { ListAdminUsersRequestDto } from '../../../application/dto/request/list-admin-users.request.dto';
import { UpdateAdminUserStatusRequestDto } from '../../../application/dto/request/update-admin-user-status.request.dto';
import { AdminUserDetailResponseDto } from '../../../application/dto/response/admin-user-detail.response.dto';
import { AdminUserListResponseDto } from '../../../application/dto/response/admin-user-list.response.dto';
import { AdminUserStatusResponseDto } from '../../../application/dto/response/admin-user-status.response.dto';
import { GetAdminUserHandler } from '../../../application/queries/get-admin-user/get-admin-user.handler';
import { GetAdminUserQuery } from '../../../application/queries/get-admin-user/get-admin-user.query';
import { ListAdminUsersHandler } from '../../../application/queries/list-admin-users/list-admin-users.handler';
import { ListAdminUsersQuery } from '../../../application/queries/list-admin-users/list-admin-users.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard'; 
import { UpdateAdminUserRoleCommand } from '../../../application/commands/update-admin-user-role/update-admin-user-role.command';
import { UpdateAdminUserRoleHandler } from '../../../application/commands/update-admin-user-role/update-admin-user-role.handler';
import { UpdateAdminUserRoleRequestDto } from '../../../application/dto/request/update-admin-user-role.request.dto';
import { AdminUserRoleResponseDto } from '../../../application/dto/response/admin-user-role.response.dto';

@Controller('admin/users')
@UseGuards(AdminPermissionGuard)
export class AdminUsersController {
  constructor(
    @Inject(ADMIN_TYPES.applications.GetAdminUserHandler)
    private readonly getAdminUserHandler: GetAdminUserHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminUsersHandler)
    private readonly listAdminUsersHandler: ListAdminUsersHandler,

    @Inject(ADMIN_TYPES.applications.UpdateAdminUserStatusHandler)
    private readonly updateAdminUserStatusHandler: UpdateAdminUserStatusHandler,
    @Inject(ADMIN_TYPES.applications.UpdateAdminUserRoleHandler)
    private readonly updateAdminUserRoleHandler: UpdateAdminUserRoleHandler,
  ) {}

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.USERS_READ)
  @ResponseMessage('Get admin users successfully')
  listUsers(
    @Query() query: ListAdminUsersRequestDto,
  ): Promise<AdminUserListResponseDto> {
    return this.listAdminUsersHandler.execute(
      new ListAdminUsersQuery(query.page, query.limit, query.search),
    );
  }

  @Get(':userId')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.USERS_READ)
  @ResponseMessage('Get admin user successfully')
  getUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AdminUserDetailResponseDto> {
    return this.getAdminUserHandler.execute(new GetAdminUserQuery(userId));
  }

  @Patch(':userId/status')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.USERS_STATUS_UPDATE)
  @ResponseMessage('Update admin user status successfully')
  updateUserStatus(
    @Auth() actor: IUserJwtPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateAdminUserStatusRequestDto,
  ): Promise<AdminUserStatusResponseDto> {
    return this.updateAdminUserStatusHandler.execute(
      new UpdateAdminUserStatusCommand(actor.id, userId, dto.isActive),
    );
  }

  @Patch(':userId/role')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.USERS_ROLE_UPDATE)
  @ResponseMessage('Update admin user role successfully')
  updateUserRole(
    @Auth() actor: IUserJwtPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateAdminUserRoleRequestDto,
  ): Promise<AdminUserRoleResponseDto> {
    return this.updateAdminUserRoleHandler.execute(
      new UpdateAdminUserRoleCommand(actor.id, userId, dto.systemRole),
    );
  }
}
