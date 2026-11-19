import {
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
import { RevokeAdminSessionCommand } from '../../../application/commands/revoke-admin-session/revoke-admin-session.command';
import { RevokeAdminSessionHandler } from '../../../application/commands/revoke-admin-session/revoke-admin-session.handler';
import { ListAdminSessionsRequestDto } from '../../../application/dto/request/list-admin-sessions.request.dto';
import { AdminSessionListResponseDto } from '../../../application/dto/response/admin-session-list.response.dto';
import type { AdminSessionsOverview } from '../../../application/ports/admin-session-reader.port';
import type { RevokedAdminSession } from '../../../application/ports/admin-session-writer.port';
import { GetAdminSessionsOverviewHandler } from '../../../application/queries/get-admin-sessions-overview/get-admin-sessions-overview.handler';
import { ListAdminSessionsHandler } from '../../../application/queries/list-admin-sessions/list-admin-sessions.handler';
import { ListAdminSessionsQuery } from '../../../application/queries/list-admin-sessions/list-admin-sessions.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';
import { adminRequestClientOf } from '../admin-request-client';

@Controller('admin/sessions')
@UseGuards(AdminPermissionGuard)
export class AdminSessionsController {
  constructor(
    @Inject(ADMIN_TYPES.applications.GetAdminSessionsOverviewHandler)
    private readonly getOverviewHandler: GetAdminSessionsOverviewHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminSessionsHandler)
    private readonly listSessionsHandler: ListAdminSessionsHandler,

    @Inject(ADMIN_TYPES.applications.RevokeAdminSessionHandler)
    private readonly revokeSessionHandler: RevokeAdminSessionHandler,
  ) {}

  @Get('overview')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.AUDIT_READ)
  @ResponseMessage('Get sessions overview successfully')
  getOverview(): Promise<AdminSessionsOverview> {
    return this.getOverviewHandler.execute();
  }

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.AUDIT_READ)
  @ResponseMessage('Get sessions successfully')
  list(
    @Query() request: ListAdminSessionsRequestDto,
  ): Promise<AdminSessionListResponseDto> {
    return this.listSessionsHandler.execute(
      new ListAdminSessionsQuery(
        request.page,
        request.limit,
        request.search,
        request.systemRole,
        request.userId,
      ),
    );
  }

  @Post(':sessionId/revoke')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SESSIONS_REVOKE)
  @ResponseMessage('Revoke session successfully')
  revoke(
    @Auth() actor: IUserJwtPayload,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Req() req: Request,
  ): Promise<RevokedAdminSession> {
    return this.revokeSessionHandler.execute(
      new RevokeAdminSessionCommand(
        actor.id,
        sessionId,
        adminRequestClientOf(req),
      ),
    );
  }
}
