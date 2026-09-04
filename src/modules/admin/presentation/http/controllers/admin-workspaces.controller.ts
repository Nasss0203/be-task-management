import {
  Controller,
  Get,
  Inject,
  Query,
  UseGuards,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/identity/identity.types';
import { ADMIN_TYPES } from '../../../admin.types';
import { ListAdminWorkspacesRequestDto } from '../../../application/dto/request/list-admin-workspaces.request.dto';
import { AdminWorkspaceListResponseDto } from '../../../application/dto/response/admin-workspace-list.response.dto';
import { ListAdminWorkspacesHandler } from '../../../application/queries/list-admin-workspaces/list-admin-workspaces.handler';
import { ListAdminWorkspacesQuery } from '../../../application/queries/list-admin-workspaces/list-admin-workspaces.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard'; 
import { AdminWorkspaceDetailResponseDto } from '../../../application/dto/response/admin-workspace-detail.response.dto';
import { GetAdminWorkspaceHandler } from '../../../application/queries/get-admin-workspace/get-admin-workspace.handler';
import { GetAdminWorkspaceQuery } from '../../../application/queries/get-admin-workspace/get-admin-workspace.query';
import { ListAdminWorkspaceMembersRequestDto } from '../../../application/dto/request/list-admin-workspace-members.request.dto';
import { AdminWorkspaceMemberListResponseDto } from '../../../application/dto/response/admin-workspace-member-list.response.dto';
import { ListAdminWorkspaceMembersHandler } from '../../../application/queries/list-admin-workspace-members/list-admin-workspace-members.handler';
import { ListAdminWorkspaceMembersQuery } from '../../../application/queries/list-admin-workspace-members/list-admin-workspace-members.query'; 
import { ListAdminWorkspaceTeamspacesRequestDto } from '../../../application/dto/request/list-admin-workspace-teamspaces.request.dto';
import { AdminWorkspaceTeamspaceListResponseDto } from '../../../application/dto/response/admin-workspace-teamspace-list.response.dto';
import { ListAdminWorkspaceTeamspacesHandler } from '../../../application/queries/list-admin-workspace-teamspaces/list-admin-workspace-teamspaces.handler';
import { ListAdminWorkspaceTeamspacesQuery } from '../../../application/queries/list-admin-workspace-teamspaces/list-admin-workspace-teamspaces.query'; 
import { ListAdminWorkspacePagesRequestDto } from '../../../application/dto/request/list-admin-workspace-pages.request.dto';
import { AdminWorkspacePageListResponseDto } from '../../../application/dto/response/admin-workspace-page-list.response.dto';
import { ListAdminWorkspacePagesHandler } from '../../../application/queries/list-admin-workspace-pages/list-admin-workspace-pages.handler';
import { ListAdminWorkspacePagesQuery } from '../../../application/queries/list-admin-workspace-pages/list-admin-workspace-pages.query'; 


@Controller('admin/workspaces')
@UseGuards(AdminPermissionGuard)
export class AdminWorkspacesController {
  constructor(
    @Inject(ADMIN_TYPES.applications.ListAdminWorkspacesHandler)
    private readonly listAdminWorkspacesHandler: ListAdminWorkspacesHandler,

    @Inject(ADMIN_TYPES.applications.GetAdminWorkspaceHandler)
    private readonly getAdminWorkspaceHandler: GetAdminWorkspaceHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminWorkspaceMembersHandler)
    private readonly listAdminWorkspaceMembersHandler: ListAdminWorkspaceMembersHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminWorkspaceTeamspacesHandler)
    private readonly listAdminWorkspaceTeamspacesHandler: ListAdminWorkspaceTeamspacesHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminWorkspacePagesHandler)
    private readonly listAdminWorkspacePagesHandler: ListAdminWorkspacePagesHandler,
  ) {}

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.WORKSPACES_READ)
  @ResponseMessage('Get admin workspaces successfully')
  listWorkspaces(
    @Query() query: ListAdminWorkspacesRequestDto,
  ): Promise<AdminWorkspaceListResponseDto> {
    return this.listAdminWorkspacesHandler.execute(
      new ListAdminWorkspacesQuery(query.page, query.limit, query.search),
    );
  }

  @Get(':workspaceId/pages')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.WORKSPACES_READ)
  @ResponseMessage('Get admin workspace pages successfully')
  listWorkspacePages(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() request: ListAdminWorkspacePagesRequestDto,
  ): Promise<AdminWorkspacePageListResponseDto> {
    return this.listAdminWorkspacePagesHandler.execute(
      new ListAdminWorkspacePagesQuery(
        workspaceId,
        request.page,
        request.limit,
        request.search,
        request.teamspaceId,
      ),
    );
  }

  @Get(':workspaceId')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.WORKSPACES_READ)
  @ResponseMessage('Get admin workspace successfully')
  getWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
  ): Promise<AdminWorkspaceDetailResponseDto> {
    return this.getAdminWorkspaceHandler.execute(
      new GetAdminWorkspaceQuery(workspaceId),
    );
  }

  @Get(':workspaceId/members')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.WORKSPACES_READ)
  @ResponseMessage('Get admin workspace members successfully')
  listWorkspaceMembers(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() request: ListAdminWorkspaceMembersRequestDto,
  ): Promise<AdminWorkspaceMemberListResponseDto> {
    return this.listAdminWorkspaceMembersHandler.execute(
      new ListAdminWorkspaceMembersQuery(
        workspaceId,
        request.page,
        request.limit,
        request.search,
      ),
    );
  }

  @Get(':workspaceId/teamspaces')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.WORKSPACES_READ)
  @ResponseMessage('Get admin workspace teamspaces successfully')
  listWorkspaceTeamspaces(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() request: ListAdminWorkspaceTeamspacesRequestDto,
  ): Promise<AdminWorkspaceTeamspaceListResponseDto> {
    return this.listAdminWorkspaceTeamspacesHandler.execute(
      new ListAdminWorkspaceTeamspacesQuery(
        workspaceId,
        request.page,
        request.limit,
        request.search,
      ),
    );
  }
}
