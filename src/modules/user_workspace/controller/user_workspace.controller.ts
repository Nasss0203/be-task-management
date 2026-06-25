import { Body, Controller, Get, Inject, Param, Post, Patch, Delete } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  InviteRateLimit,
  ReadRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { AddWorkspaceMemberDto, UpdateWorkspaceMemberRoleDto } from '../dto/create-user_workspace.dto';
import { MemberWorkspaceResponseDto } from '../dto/response/user_workspace.response.dto';
import { type AddWorkspaceMemberApplication } from '../interfaces/applications/add-member-workspace.application.interface';
import { type UpdateMemberWorkspaceApplication } from '../interfaces/applications/update-member-workspace.application.interface';
import { type DeleteMemberWorkspaceApplication } from '../interfaces/applications/delete-member-workspace.application.interface';
import { type FindAllMemberApplication } from '../interfaces/applications/find-user-workspace.application.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { UserWorkspacesService } from '../user_workspace.service';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';

@Controller('workspace-members')
@ReadRateLimit()
export class UserWorkspacesController {
  constructor(
    private readonly UserWorkspacesService: UserWorkspacesService,

    @Inject(USER_WORKSPACE_TYPES.applications.AddWorkspaceMemberApplication)
    private readonly addWorkspaceMemberApplication: AddWorkspaceMemberApplication,

    @Inject(USER_WORKSPACE_TYPES.applications.UpdateMemberWorkspaceApplication)
    private readonly updateMemberWorkspaceApplication: UpdateMemberWorkspaceApplication,

    @Inject(USER_WORKSPACE_TYPES.applications.DeleteMemberWorkspaceApplication)
    private readonly deleteMemberWorkspaceApplication: DeleteMemberWorkspaceApplication,

    @Inject(USER_WORKSPACE_TYPES.applications.FindAllMemberApplication)
    private readonly findAllMemberApplication: FindAllMemberApplication,
  ) {}

  @Post(':workspaceId/members')
  @InviteRateLimit()
  @ResponseMessage('Add member')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_ADD)
  addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AddWorkspaceMemberDto,
    @Auth() auth: IAuth,
  ) {
    return this.addWorkspaceMemberApplication.addMember(
      workspaceId,
      dto,
      auth.id,
    );
  }

  @Get(':workspaceId/members')
  @ResponseMessage('Find member')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_READ)
  async findAllMember(
    @Param('workspaceId') workspaceId: string,
  ): Promise<MemberWorkspaceResponseDto[]> {
    return this.findAllMemberApplication.findAllMember(workspaceId);
  }

  @Patch(':workspaceId/members/:userId')
  @ResponseMessage('Update member role')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_UPDATE_ROLE)
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateWorkspaceMemberRoleDto,
    @Auth() auth: IAuth,
  ) {
    await this.updateMemberWorkspaceApplication.updateRole(
      workspaceId,
      userId,
      dto.role_name,
      auth.id,
    );
  }

  @Delete(':workspaceId/members/:userId')
  @ResponseMessage('Remove member from workspace')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_REMOVE)
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteMemberWorkspaceApplication.deleteMember(
      workspaceId,
      userId,
      auth.id,
    );
  }
}
