import { Teamspace } from 'src/modules/teamspace/domain/aggregates/teamspace/teamspace.aggregate';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';

export class DiscoverTeamspaceItemResponseDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  visibility: TeamspaceVisibility;
  isMember: boolean;

  static fromDomain(teamspace: Teamspace, isMember: boolean): DiscoverTeamspaceItemResponseDto {
    return {
      id: teamspace.getId(),
      workspaceId: teamspace.getWorkspaceId(),
      name: teamspace.getName(),
      description: teamspace.getDescription(),
      visibility: teamspace.getVisibility(),
      isMember,
    };
  }
}

export class DiscoverTeamspacesResponseDto {
  items: DiscoverTeamspaceItemResponseDto[];
  total: number;
  page: number;
  limit: number;
}
