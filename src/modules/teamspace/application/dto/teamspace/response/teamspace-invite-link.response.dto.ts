import { TeamspaceInviteLink, TeamspaceInviteLinkStatus } from 'src/modules/teamspace/domain/entities/teamspace-invite-link.entity';

export class TeamspaceInviteLinkResponseDto {
  id: string;
  teamspaceId: string;
  createdBy: string | null;
  createdAt: Date;
  expiresAt: Date;
  maxUses: number | null;
  useCount: number;
  revokedAt: Date | null;
  status: TeamspaceInviteLinkStatus;

  static fromDomain(link: TeamspaceInviteLink): TeamspaceInviteLinkResponseDto {
    return {
      id: link.getId(),
      teamspaceId: link.getTeamspaceId(),
      createdBy: link.getCreatedBy(),
      createdAt: link.getCreatedAt(),
      expiresAt: link.getExpiresAt(),
      maxUses: link.getMaxUses(),
      useCount: link.getUseCount(),
      revokedAt: link.getRevokedAt(),
      status: link.getStatus(),
    };
  }
}

export class CreatedTeamspaceInviteLinkResponseDto extends TeamspaceInviteLinkResponseDto {
  token: string;
  url: string | null;
  relativePath: string;

  static fromCreated(link: TeamspaceInviteLink, token: string): CreatedTeamspaceInviteLinkResponseDto {
    const relativePath = `/join/teamspace/${token}`;
    const baseUrl = process.env.FRONTEND_URL?.trim().replace(/\/$/, '') ||
      process.env.CLIENT_URL?.trim().replace(/\/$/, '');
    return {
      ...TeamspaceInviteLinkResponseDto.fromDomain(link),
      token,
      url: baseUrl ? `${baseUrl}${relativePath}` : null,
      relativePath,
    };
  }
}
