import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { type UserRoleRepository } from 'src/modules/user_roles/interfaces/repositories/user_role.repository.interface';
import { USER_ROLE_TYPES } from 'src/modules/user_roles/interfaces/types';
import { EntityManager } from 'typeorm';
import { type FindUserWorkspaceRepository } from '../interfaces/repositories/find-user-workspace.repository.interface';
import { type UserWorkspaceRepository } from '../interfaces/repositories/user_workspace.repository.interface';
import {
  DeleteMemberWorkspaceInput,
  DeleteMemberWorkspaceService,
} from '../interfaces/services/delete-member-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteMemberWorkspaceServiceImpl
  implements DeleteMemberWorkspaceService
{
  constructor(
    @Inject(USER_WORKSPACE_TYPES.repositories.FindUserWorkspaceRepository)
    private readonly findUserWorkspaceRepository: FindUserWorkspaceRepository,

    @Inject(USER_WORKSPACE_TYPES.repositories.UserWorkspaceRepository)
    private readonly userWorkspaceRepository: UserWorkspaceRepository,

    @Inject(USER_ROLE_TYPES.repositories.UserRoleRepository)
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async deleteMember(input: DeleteMemberWorkspaceInput, manager?: EntityManager) {
    const targetMember =
      await this.findUserWorkspaceRepository.findMemberInWorkspace(
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
        await this.findUserWorkspaceRepository.findMemberInWorkspace(
          input.workspace_id,
          input.actor_id,
          manager,
        );

      if (!actorMember) {
        throw new ForbiddenException('Actor is not in the workspace');
      }

      if (![RoleName.OWNER, RoleName.ADMIN].includes(actorMember.role_name)) {
        throw new ForbiddenException('Only admin or owner can remove members');
      }

      if (actorMember.role_name === RoleName.ADMIN) {
        if ([RoleName.OWNER, RoleName.ADMIN].includes(targetMember.role_name)) {
          throw new ForbiddenException('Admins cannot remove Owners or other Admins');
        }
      }
    }

    if (targetMember.role_name === RoleName.OWNER) {
      const allMembers = await this.findUserWorkspaceRepository.findAllMember(
        input.workspace_id,
        manager,
      );
      const ownerCount = allMembers.filter(
        (m) => m.role_name === RoleName.OWNER,
      ).length;
      
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last owner of the workspace. Please transfer ownership first.',
        );
      }
    }

    await this.userWorkspaceRepository.deleteByUserId(
      input.workspace_id,
      input.user_id,
      manager,
    );

    await this.userRoleRepository.deleteByUserId(
      input.workspace_id,
      input.user_id,
      manager,
    );
  }
}
