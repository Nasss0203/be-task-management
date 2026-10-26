import { TeamspaceInvitation } from 'src/modules/teamspace/domain/entities/teamspace-invitation.entity';
import { TeamspaceInvitationStatus } from 'src/modules/teamspace/domain/enums/teamspace-invitation-status.enum';

export class TeamspaceInvitationManagementResponseDto {
  id: string;
  teamspaceId: string;
  workspaceMemberId: string;
  invitedBy: string | null;
  status: TeamspaceInvitationStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;

  static fromDomain(invitation: TeamspaceInvitation, now = new Date()): TeamspaceInvitationManagementResponseDto {
    return {
      id: invitation.getId(),
      teamspaceId: invitation.getTeamspaceId(),
      workspaceMemberId: invitation.getWorkspaceMemberId(),
      invitedBy: invitation.getInvitedBy(),
      status: invitation.getEffectiveStatus(now),
      createdAt: invitation.getCreatedAt(),
      updatedAt: invitation.getUpdatedAt(),
      expiresAt: invitation.getExpiresAt(),
      acceptedAt: invitation.getAcceptedAt(),
    };
  }
}

export class ListTeamspaceInvitationsResponseDto {
  items: TeamspaceInvitationManagementResponseDto[];
  total: number;
  page: number;
  limit: number;
}
