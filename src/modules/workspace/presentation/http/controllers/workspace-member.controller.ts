import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  InviteRateLimit,
  ReadRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { AddWorkspaceMemberCommand } from 'src/modules/workspace/application/commands/workspace-member/add-workspace-member/add-workspace-member.command';
import { AddWorkspaceMemberHandler } from 'src/modules/workspace/application/commands/workspace-member/add-workspace-member/add-workspace-member.handler';
import { DeleteWorkspaceMemberCommand } from 'src/modules/workspace/application/commands/workspace-member/delete-workspace-member/delete-workspace-member.command';
import { DeleteWorkspaceMemberHandler } from 'src/modules/workspace/application/commands/workspace-member/delete-workspace-member/delete-workspace-member.handler';
import { UpdateWorkspaceMemberRoleCommand } from 'src/modules/workspace/application/commands/workspace-member/update-workspace-member-role/update-workspace-member-role.command';
import { UpdateWorkspaceMemberRoleHandler } from 'src/modules/workspace/application/commands/workspace-member/update-workspace-member-role/update-workspace-member-role.handler';
import { WorkspaceMemberDetailResponseDto } from 'src/modules/workspace/application/dto/workspace-member/response/workspace-member.response.dto';
import {
  AddWorkspaceMemberDto,
  UpdateWorkspaceMemberRoleDto,
} from 'src/modules/workspace/application/dto/workspace-member/workspace-member.dto';
import { ListWorkspaceMembersHandler } from 'src/modules/workspace/application/queries/workspace-member/list-workspace-members/list-workspace-members.handler';
import { ListWorkspaceMembersQuery } from 'src/modules/workspace/application/queries/workspace-member/list-workspace-members/list-workspace-members.query';
import { type IAuth } from 'src/types/auth';

@Controller('workspace-members')
@ReadRateLimit()
export class WorkspaceMemberController {
  constructor(
    private readonly addWorkspaceMemberHandler: AddWorkspaceMemberHandler,
    private readonly updateWorkspaceMemberRoleHandler: UpdateWorkspaceMemberRoleHandler,
    private readonly deleteWorkspaceMemberHandler: DeleteWorkspaceMemberHandler,
    private readonly listWorkspaceMembersHandler: ListWorkspaceMembersHandler,
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
    return this.addWorkspaceMemberHandler.execute(
      new AddWorkspaceMemberCommand(
        workspaceId,
        dto.user_id,
        dto.role_name,
        auth.id,
      ),
    );
  }

  @Get(':workspaceId/members')
  @ResponseMessage('Find member')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_READ)
  async findAllMember(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceMemberDetailResponseDto[]> {
    return this.listWorkspaceMembersHandler.execute(
      new ListWorkspaceMembersQuery(workspaceId),
    );
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
    await this.updateWorkspaceMemberRoleHandler.execute(
      new UpdateWorkspaceMemberRoleCommand(
        workspaceId,
        userId,
        dto.role_name,
        auth.id,
      ),
    );
  }

  @Delete(':workspaceId/members/me')
  @ResponseMessage('Leave workspace')
  async leaveWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteWorkspaceMemberHandler.execute(
      new DeleteWorkspaceMemberCommand(workspaceId, auth.id, auth.id),
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
    await this.deleteWorkspaceMemberHandler.execute(
      new DeleteWorkspaceMemberCommand(workspaceId, userId, auth.id),
    );
  }
}
