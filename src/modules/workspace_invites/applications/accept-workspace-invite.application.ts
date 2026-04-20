import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_ROLE_TYPES } from 'src/modules/user_roles/interfaces/types';
import { type FindUserService } from 'src/modules/users/interfaces/services/find-user.service.interface';
import { USER_TYPES } from 'src/modules/users/interfaces/types';

import { WorkspaceInviteStatus } from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteResponseDto } from '../dto/response/workspace_invites-response.dto';
import { AcceptWorkspaceInviteApplication } from '../interfaces/applications/accept-workspace-invite.application.interface';
import { type AcceptWorkspaceInviteService } from '../interfaces/services/accept-workspace-invite.service.interface';

import { type UnitOfWork } from 'src/interface/index.interface';
import { type FindRoleService } from 'src/modules/role/interfaces/services/find-role.service.interface';
import { ROLE_TYPES } from 'src/modules/role/interfaces/types';
import { type CreateUserRoleService } from 'src/modules/user_roles/interfaces/services/create.user_role.service.interface';
import { type CreateUserWorkspaceService } from 'src/modules/user_workspace/interfaces/services/create.user_workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { type FindWorkspaceInviteService } from '../interfaces/services/find-workspace-invite.service.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WorkspaceInviteMapper } from '../mapper/workspace_invites.mapper';

@Injectable()
export class AcceptWorkspaceInviteApplicationImpl implements AcceptWorkspaceInviteApplication {
  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.services.FindWorkspaceInviteService)
    private readonly findWorkspaceInviteService: FindWorkspaceInviteService,

    @Inject(WORKSPACE_INVITE_TYPES.services.AcceptWorkspaceInviteService)
    private readonly acceptWorkspaceInviteService: AcceptWorkspaceInviteService,

    @Inject(USER_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,

    @Inject(USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService)
    private readonly createUserWorkspaceService: CreateUserWorkspaceService,

    @Inject(USER_ROLE_TYPES.services.CreateUserRoleService)
    private readonly createUserRoleService: CreateUserRoleService,

    @Inject(ROLE_TYPES.services.FindRoleService)
    private readonly findRoleService: FindRoleService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async acceptWorkspaceInvite(
    token: string,
    userId: string,
  ): Promise<WorkspaceInviteResponseDto> {
    if (!token || !token.trim()) {
      throw new BadRequestException('token is required');
    }

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const invite = await this.findWorkspaceInviteService.findByToken(token);

    if (!invite) {
      throw new NotFoundException('Workspace invite not found');
    }

    if (invite.status !== WorkspaceInviteStatus.PENDING) {
      throw new BadRequestException('Workspace invite is no longer valid');
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new BadRequestException('Workspace invite has expired');
    }

    const user = await this.findUserService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const inviteEmail = invite.email.trim().toLowerCase();
    const currentUserEmail = user.email.trim().toLowerCase();

    if (inviteEmail !== currentUserEmail) {
      throw new ForbiddenException(
        'This invite does not belong to the current account',
      );
    }

    if (invite.user_id && invite.user_id !== user.id) {
      throw new ForbiddenException(
        'This invite does not belong to the current user',
      );
    }

    const acceptedInvite = await this.uow.runInTransaction(async (manager) => {
      // Nếu service addMember của bạn đã tự check trùng thì giữ nguyên.
      // Nếu chưa có, bạn nên check user đã ở workspace chưa trước khi add.
      await this.createUserWorkspaceService.create(
        {
          workspace_id: invite.workspace_id,
          user_id: user.id,
        },
        manager,
      );

      const role = await this.findRoleService.findByNameAndWorkspace(
        invite.role_name,
        invite.workspace_id,
      );

      if (!role) {
        throw new NotFoundException('Role not found in workspace');
      }
      // Đổi tên method theo service hiện tại của bạn nếu khác.
      await this.createUserRoleService.create(
        {
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role_id: role.id,
          assigned_by: invite.invited_by,
        },
        manager,
      );

      return this.acceptWorkspaceInviteService.acceptWorkspaceInvite(
        token,
        manager,
      );
    });
    console.log('🚀 ~ acceptedInvite~', acceptedInvite);

    return WorkspaceInviteMapper.toResponse(acceptedInvite);
  }
}
