import { TeamspaceInvitation } from 'src/modules/teamspace/domain/entities/teamspace-invitation.entity';
import { TeamspaceInvitationStatus } from 'src/modules/teamspace/domain/enums/teamspace-invitation-status.enum';

export class TeamspaceInvitationResponseDto {
  id: string;
  teamspaceId: string;
  status: TeamspaceInvitationStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;

  static fromDomain(invitation: TeamspaceInvitation): TeamspaceInvitationResponseDto {
    return {
      id: invitation.getId(),
      teamspaceId: invitation.getTeamspaceId(),
      status: invitation.getEffectiveStatus(),
      expiresAt: invitation.getExpiresAt(),
      acceptedAt: invitation.getAcceptedAt(),
      createdAt: invitation.getCreatedAt(),
    };
  }
}
