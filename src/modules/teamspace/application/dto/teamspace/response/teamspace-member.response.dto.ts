import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';

export class TeamspaceMemberResponseDto {
  id: string;
  teamspaceId: string;
  workspaceMemberId: string;
  roleName: TeamspaceRole;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(member: TeamspaceMember): TeamspaceMemberResponseDto {
    const dto = new TeamspaceMemberResponseDto();
    dto.id = member.getId();
    dto.teamspaceId = member.getTeamspaceId();
    dto.workspaceMemberId = member.getWorkspaceMemberId();
    dto.roleName = member.getRoleName();
    dto.joinedAt = member.getJoinedAt();
    dto.createdAt = member.getCreatedAt();
    dto.updatedAt = member.getUpdatedAt();
    return dto;
  }
}
