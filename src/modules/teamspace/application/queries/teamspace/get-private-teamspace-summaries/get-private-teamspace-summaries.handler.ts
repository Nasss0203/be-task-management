import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrivateTeamspaceSummaryResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/private-teamspace-summary.response.dto';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { GetPrivateTeamspaceSummariesQuery } from './get-private-teamspace-summaries.query';

@Injectable()
export class GetPrivateTeamspaceSummariesHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
  ) {}

  async execute(
    query: GetPrivateTeamspaceSummariesQuery,
  ): Promise<PrivateTeamspaceSummaryResponseDto[]> {
    const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
      query.workspaceId,
      query.userId,
    );

    if (!actor || actor.isGuest() || actor.getRole() !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Only workspace owners can list private teamspaces',
      );
    }

    const summaries = await this.teamspaceRepo.findPrivateSummariesNotJoined(
      query.workspaceId,
      actor.getId(),
    );

    return summaries.map((summary) =>
      PrivateTeamspaceSummaryResponseDto.fromSummary(summary),
    );
  }
}
