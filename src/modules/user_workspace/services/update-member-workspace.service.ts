import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { type FindRoleRepository } from 'src/modules/role/interfaces/repositories/find-role.repository.interface';
import { ROLE_TYPES } from 'src/modules/role/interfaces/types';
import { type UserRoleRepository } from 'src/modules/user_roles/interfaces/repositories/user_role.repository.interface';
import { USER_ROLE_TYPES } from 'src/modules/user_roles/interfaces/types';
import { EntityManager } from 'typeorm';
import { type FindUserWorkspaceRepository } from '../interfaces/repositories/find-user-workspace.repository.interface';
import {
  UpdateMemberWorkspaceInput,
  UpdateMemberWorkspaceService,
} from '../interfaces/services/update-member-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateMemberWorkspaceServiceImpl implements UpdateMemberWorkspaceService {
  constructor(
    @Inject(USER_WORKSPACE_TYPES.repositories.FindUserWorkspaceRepository)
    private readonly findUserWorkspaceRepository: FindUserWorkspaceRepository,

    @Inject(ROLE_TYPES.repositories.FindRoleRepository)
    private readonly findRoleRepository: FindRoleRepository,

    @Inject(USER_ROLE_TYPES.repositories.UserRoleRepository)
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async updateRole(input: UpdateMemberWorkspaceInput, manager?: EntityManager) {
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
      throw new ForbiddenException('Only admin or owner can update roles');
    }

    const targetMember =
      await this.findUserWorkspaceRepository.findMemberInWorkspace(
        input.workspace_id,
        input.user_id,
        manager,
      );

    if (!targetMember) {
      throw new NotFoundException('Member not found in workspace');
    }

    // Role-specific validations
    if (actorMember.role_name === RoleName.ADMIN) {
      if (
        [RoleName.OWNER, RoleName.ADMIN].includes(input.role_name) ||
        targetMember.role_name === RoleName.OWNER ||
        targetMember.role_name === RoleName.ADMIN
      ) {
        throw new ForbiddenException(
          'Admins cannot modify Owners or other Admins, and cannot promote to Owner/Admin',
        );
      }
    }

    // If downgrading an owner, ensure at least one other owner exists
    if (
      targetMember.role_name === RoleName.OWNER &&
      input.role_name !== RoleName.OWNER
    ) {
      const allMembers = await this.findUserWorkspaceRepository.findAllMember(
        input.workspace_id,
        manager,
      );
      const ownerCount = allMembers.filter(
        (m) => m.role_name === RoleName.OWNER,
      ).length;
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot change role of the last owner in the workspace',
        );
      }
    }

    const role = await this.findRoleRepository.findByNameAndWorkspace(
      input.role_name,
      input.workspace_id,
      manager,
    );

    if (!role) {
      throw new NotFoundException('Role not found in workspace');
    }

    // Delete existing role and save new role
    await this.userRoleRepository.deleteByUserId(
      input.workspace_id,
      input.user_id,
      manager,
    );

    await this.userRoleRepository.save(
      {
        workspace_id: input.workspace_id,
        user_id: input.user_id,
        role_id: role.id,
        assigned_by: input.actor_id,
      },
      manager,
    );
  }
}
