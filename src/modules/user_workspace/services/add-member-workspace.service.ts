import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { type FindRoleRepository } from 'src/modules/role/interfaces/repositories/find-role.repository.interface';
import { ROLE_TYPES } from 'src/modules/role/interfaces/types';
import { type UserRoleRepository } from 'src/modules/user_roles/interfaces/repositories/user_role.repository.interface';
import { USER_ROLE_TYPES } from 'src/modules/user_roles/interfaces/types';
import { EntityManager } from 'typeorm';
import { type FindUserWorkspaceRepository } from '../interfaces/repositories/find-user-workspace.repository.interface';
import { type UserWorkspaceRepository } from '../interfaces/repositories/user_workspace.repository.interface';
import {
  AddMemberWorkspaceInput,
  AddMemberWorkspaceService,
} from '../interfaces/services/add-member-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class AddMemberWorkspaceServiceImpl implements AddMemberWorkspaceService {
  constructor(
    @Inject(USER_WORKSPACE_TYPES.repositories.FindUserWorkspaceRepository)
    private readonly findUserWorkspaceRepository: FindUserWorkspaceRepository,

    @Inject(USER_WORKSPACE_TYPES.repositories.UserWorkspaceRepository)
    private readonly userWorkspaceRepository: UserWorkspaceRepository,

    @Inject(ROLE_TYPES.repositories.FindRoleRepository)
    private readonly findRoleRepository: FindRoleRepository,

    @Inject(USER_ROLE_TYPES.repositories.UserRoleRepository)
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async addMember(input: AddMemberWorkspaceInput, manager?: EntityManager) {
    const roleName = input.role_name ?? RoleName.MEMBER;

    if ([RoleName.OWNER, RoleName.ADMIN].includes(roleName)) {
      const actorMember =
        input.added_by &&
        (await this.findUserWorkspaceRepository.findMemberInWorkspace(
          input.workspace_id,
          input.added_by,
          manager,
        ));

      if (!actorMember || actorMember.role_name !== RoleName.OWNER) {
        throw new ForbiddenException(
          'Only workspace owner can add owner or admin members',
        );
      }
    }

    const existed =
      await this.findUserWorkspaceRepository.findMemberInWorkspace(
        input.workspace_id,
        input.user_id,
        manager,
      );

    if (existed) {
      throw new ConflictException('User already belongs to this workspace');
    }

    const membership = await this.userWorkspaceRepository.create(
      {
        workspace_id: input.workspace_id,
        user_id: input.user_id,
      },
      manager,
    );

    const role = await this.findRoleRepository.findByNameAndWorkspace(
      roleName,
      input.workspace_id,
      manager,
    );

    if (!role) {
      throw new NotFoundException('Role not found in workspace');
    }

    await this.userRoleRepository.save(
      {
        workspace_id: input.workspace_id,
        user_id: input.user_id,
        role_id: role.id,
        assigned_by: input.added_by,
      },
      manager,
    );

    return membership;
  }
}
