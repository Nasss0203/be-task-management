import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreateWorkspaceInviteDto } from '../dto/create-workspace_invite.dto';
import { WorkspaceInviteResponseDto } from '../dto/response/workspace_invites-response.dto';
import { UpdateWorkspaceInviteDto } from '../dto/update-workspace_invite.dto';
import { type InviteWorkspaceMemberApplication } from '../interfaces/applications/invite-workspace-member.application.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WorkspaceInvitesService } from '../workspace_invites.service';

@Controller('workspace-invites')
export class WorkspaceInvitesController {
  constructor(
    private readonly workspaceInvitesService: WorkspaceInvitesService,
    @Inject(
      WORKSPACE_INVITE_TYPES.applications.InviteWorkspaceMemberApplication,
    )
    private readonly inviteWorkspaceMemberApplication: InviteWorkspaceMemberApplication,
  ) {}

  @Post()
  @ResponseMessage('Invite workspace member successfully')
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_ADD)
  async invite(
    @Body() dto: CreateWorkspaceInviteDto,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceInviteResponseDto> {
    const invitedBy = auth.id;
    console.log('invitedBy', invitedBy);

    if (!invitedBy) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.inviteWorkspaceMemberApplication.invite(
      dto.workspaceId,
      invitedBy,
      dto,
    );
  }
  @Post()
  create(@Body() createWorkspaceInviteDto: CreateWorkspaceInviteDto) {
    return this.workspaceInvitesService.create(createWorkspaceInviteDto);
  }

  @Get()
  findAll() {
    return this.workspaceInvitesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspaceInvitesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceInviteDto: UpdateWorkspaceInviteDto,
  ) {
    return this.workspaceInvitesService.update(+id, updateWorkspaceInviteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspaceInvitesService.remove(+id);
  }
}
