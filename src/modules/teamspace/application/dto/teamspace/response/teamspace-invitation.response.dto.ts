import { TeamspaceInvitation } from 'src/modules/teamspace/domain/entities/teamspace-invitation.entity';
import { TeamspaceInvitationStatus } from 'src/modules/teamspace/domain/enums/teamspace-invitation-status.enum';
import type { RecipientTeamspaceInvitation } from 'src/modules/teamspace/domain/repositories/teamspace-invitation.repository';

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

export class MyTeamspaceInvitationResponseDto extends TeamspaceInvitationResponseDto {
  teamspaceName: string;
  teamspaceIcon: string | null;
  workspaceId: string;
  workspaceName: string;
  inviterName: string | null;

  static fromRecipientView(view: RecipientTeamspaceInvitation): MyTeamspaceInvitationResponseDto {
    return {
      ...TeamspaceInvitationResponseDto.fromDomain(view.invitation),
      teamspaceName: view.teamspaceName,
      teamspaceIcon: view.teamspaceIcon,
      workspaceId: view.workspaceId,
      workspaceName: view.workspaceName,
      inviterName: view.inviterName,
    };
  }
}
