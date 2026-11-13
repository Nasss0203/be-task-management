import type { PrivateTeamspaceSummary } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';

export class PrivateTeamspaceSummaryResponseDto {
  id: string;
  name: string;
  icon: string | null;
  visibility: TeamspaceVisibility;
  ownerNames: string[];
  memberCount: number;

  static fromSummary({
    teamspace,
    ownerNames,
    memberCount,
  }: PrivateTeamspaceSummary): PrivateTeamspaceSummaryResponseDto {
    return {
      id: teamspace.getId(),
      name: teamspace.getName(),
      icon: teamspace.getIcon(),
      visibility: teamspace.getVisibility(),
      ownerNames,
      memberCount,
    };
  }
}
