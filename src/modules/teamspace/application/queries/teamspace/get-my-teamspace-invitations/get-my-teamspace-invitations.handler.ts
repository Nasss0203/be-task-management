import { Inject, Injectable } from '@nestjs/common';
import { TeamspaceInvitationResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invitation.response.dto';
import type { TeamspaceInvitationRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invitation.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { GetMyTeamspaceInvitationsQuery } from './get-my-teamspace-invitations.query';

@Injectable()
export class GetMyTeamspaceInvitationsHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceInvitationRepository)
    private readonly invitationRepo: TeamspaceInvitationRepository,
  ) {}

  async execute(query: GetMyTeamspaceInvitationsQuery): Promise<TeamspaceInvitationResponseDto[]> {
    const invitations = await this.invitationRepo.findByRecipientUserId(query.userId);
    return invitations.map(TeamspaceInvitationResponseDto.fromDomain);
  }
}
