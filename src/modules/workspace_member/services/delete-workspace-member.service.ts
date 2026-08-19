import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { EntityManager } from 'typeorm';
import { type FindWorkspaceMemberRepository } from '../interfaces/repositories/find-workspace-member.repository.interface';
import { type WorkspaceMemberRepository } from '../interfaces/repositories/workspace-member.repository.interface';
import {
  DeleteWorkspaceMemberInput,
  DeleteWorkspaceMemberService,
} from '../interfaces/services/delete-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteWorkspaceMemberServiceImpl implements DeleteWorkspaceMemberService {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.repositories.FindWorkspaceMemberRepository)
    private readonly findWorkspaceMemberRepository: FindWorkspaceMemberRepository,

    @Inject(WORKSPACE_MEMBER_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  async deleteMember(
    input: DeleteWorkspaceMemberInput,
    manager?: EntityManager,
  ) {
    const targetMember =
      await this.findWorkspaceMemberRepository.findMemberInWorkspace(
        input.workspace_id,
        input.user_id,
        manager,
      );

    if (!targetMember) {
      throw new NotFoundException('Member not found in workspace');
    }

    const isSelfLeave = input.actor_id === input.user_id;

    if (!isSelfLeave) {
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
        throw new ForbiddenException('Only admin or owner can remove members');
      }

      if (actorMember.role_name === WorkspaceRole.ADMIN) {
        if (
          [WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(
            targetMember.role_name,
          )
        ) {
          throw new ForbiddenException(
            'Admins cannot remove Owners or other Admins',
          );
        }
      }
    }

    if (targetMember.role_name === WorkspaceRole.OWNER) {
      const allMembers = await this.findWorkspaceMemberRepository.findAllMember(
        input.workspace_id,
        manager,
      );
      const ownerCount = allMembers.filter(
        (m) => m.role_name === WorkspaceRole.OWNER,
      ).length;

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last owner of the workspace. Please transfer ownership first.',
        );
      }
    }

    await this.workspaceMemberRepository.deleteByUserId(
      input.workspace_id,
      input.user_id,
      manager,
    );
  }
}
