import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { EntityManager } from 'typeorm';
import { type FindWorkspaceMemberRepository } from '../interfaces/repositories/find-workspace-member.repository.interface';
import { type WorkspaceMemberRepository } from '../interfaces/repositories/workspace-member.repository.interface';
import {
  AddWorkspaceMemberInput,
  AddWorkspaceMemberService,
} from '../interfaces/services/add-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../interfaces/types';

@Injectable()
export class AddWorkspaceMemberServiceImpl implements AddWorkspaceMemberService {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.repositories.FindWorkspaceMemberRepository)
    private readonly findWorkspaceMemberRepository: FindWorkspaceMemberRepository,

    @Inject(WORKSPACE_MEMBER_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  async addMember(input: AddWorkspaceMemberInput, manager?: EntityManager) {
    const roleName = input.role_name ?? WorkspaceRole.MEMBER;

    if ([WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(roleName)) {
      const actorMember =
        input.added_by &&
        (await this.findWorkspaceMemberRepository.findMemberInWorkspace(
          input.workspace_id,
          input.added_by,
          manager,
        ));

      if (!actorMember || actorMember.role_name !== WorkspaceRole.OWNER) {
        throw new ForbiddenException(
          'Only workspace owner can add owner or admin members',
        );
      }
    }

    const existed =
      await this.findWorkspaceMemberRepository.findMemberInWorkspace(
        input.workspace_id,
        input.user_id,
        manager,
      );

    if (existed) {
      throw new ConflictException('User already belongs to this workspace');
    }

    const membership = await this.workspaceMemberRepository.create(
      {
        workspace_id: input.workspace_id,
        user_id: input.user_id,
        role_name: roleName,
      },
      manager,
    );

    return membership;
  }
}
