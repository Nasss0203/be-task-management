import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { Teamspace } from 'src/modules/workspace/domain/aggregates/teamspace/teamspace.aggregate';
import { TeamspaceMember } from 'src/modules/workspace/domain/entities/teamspace-member.entity';
import { TeamspaceRole } from 'src/modules/workspace/domain/enums/teamspace-role.enum';

import type { TeamspaceMemberRepository } from 'src/modules/workspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/workspace/domain/repositories/teamspace.repository';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';

import { generateSlug } from 'src/utils';

import { TeamspaceResponseDto } from '../../../dto/teamspace/response/teamspace.response.dto';
import { CreateTeamspaceCommand } from './create-teamspace.command';

@Injectable()
export class CreateTeamspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepository: TeamspaceRepository,

    @Inject(WORKSPACE_TYPES.repositories.TeamspaceMemberRepository)
    private readonly teamspaceMemberRepository: TeamspaceMemberRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: CreateTeamspaceCommand,
  ): Promise<TeamspaceResponseDto> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const workspaceMember =
        await this.workspaceMemberRepository.findByWorkspaceAndUser(
          command.workspaceId,
          command.userId,
          context,
        );

      if (!workspaceMember) {
        throw new ForbiddenException('User is not a member of this workspace');
      }

      const baseSlug = generateSlug(command.name).toLowerCase();

      let slug = baseSlug;

      const slugExists = await this.teamspaceRepository.existsBySlug(
        command.workspaceId,
        slug,
        context,
      );

      if (slugExists) {
        slug = `${baseSlug}-${Date.now().toString(36)}`;
      }

      const teamspace = Teamspace.create({
        workspaceId: command.workspaceId,
        name: command.name,
        slug,
        description: command.description ?? null,
        icon: command.icon ?? null,
        visibility: command.visibility,
        createdBy: command.userId,
      });

      const savedTeamspace = await this.teamspaceRepository.save(
        teamspace,
        context,
      );

      const owner = TeamspaceMember.create({
        teamspaceId: savedTeamspace.getId(),
        workspaceMemberId: workspaceMember.getId(),
        roleName: TeamspaceRole.OWNER,
      });

      await this.teamspaceMemberRepository.save(owner, context);

      return TeamspaceResponseDto.fromDomain(savedTeamspace);
    });
  }
}
