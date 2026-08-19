import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { EntityManager } from 'typeorm';
import { type FindWorkspaceMemberRepository } from '../interfaces/repositories/find-workspace-member.repository.interface';
import { type WorkspaceMemberRepository } from '../interfaces/repositories/workspace-member.repository.interface';
import {
  UpdateWorkspaceMemberInput,
  UpdateWorkspaceMemberService,
} from '../interfaces/services/update-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateWorkspaceMemberServiceImpl implements UpdateWorkspaceMemberService {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.repositories.FindWorkspaceMemberRepository)
    private readonly findWorkspaceMemberRepository: FindWorkspaceMemberRepository,

    @Inject(WORKSPACE_MEMBER_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  async updateRole(input: UpdateWorkspaceMemberInput, manager?: EntityManager) {
    const actorMember =
      await this.findWorkspaceMemberRepository.findMemberInWorkspace(
        input.workspace_id,
        input.actor_id,
        manager,
      );

    if (!actorMember) {
      throw new ForbiddenException('Actor is not in the workspace');
    }

    if (
      ![WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(
        actorMember.role_name,
      )
    ) {
      throw new ForbiddenException('Only admin or owner can update roles');
    }

    const targetMember =
      await this.findWorkspaceMemberRepository.findMemberInWorkspace(
        input.workspace_id,
        input.user_id,
        manager,
      );

    if (!targetMember) {
      throw new NotFoundException('Member not found in workspace');
    }

    // Role-specific validations
    if (actorMember.role_name === WorkspaceRole.ADMIN) {
      if (
        [WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(input.role_name) ||
        targetMember.role_name === WorkspaceRole.OWNER ||
        targetMember.role_name === WorkspaceRole.ADMIN
      ) {
        throw new ForbiddenException(
          'Admins cannot modify Owners or other Admins, and cannot promote to Owner/Admin',
        );
      }
    }

    // If downgrading an owner, ensure at least one other owner exists
    if (
      targetMember.role_name === WorkspaceRole.OWNER &&
      input.role_name !== WorkspaceRole.OWNER
    ) {
      const allMembers = await this.findWorkspaceMemberRepository.findAllMember(
        input.workspace_id,
        manager,
      );
      const ownerCount = allMembers.filter(
        (m) => m.role_name === WorkspaceRole.OWNER,
      ).length;
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot change role of the last owner in the workspace',
        );
      }
    }

    await this.workspaceMemberRepository.updateRole(
      input.workspace_id,
      input.user_id,
      input.role_name,
      manager,
    );
  }
}
