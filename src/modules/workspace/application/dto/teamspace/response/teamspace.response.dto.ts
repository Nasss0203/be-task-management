import { Teamspace } from 'src/modules/workspace/domain/aggregates/teamspace/teamspace.aggregate';
import { TeamspaceVisibility } from 'src/modules/workspace/domain/enums/teamspace-visibility.enum';

export class TeamspaceResponseDto {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  visibility: TeamspaceVisibility;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(teamspace: Teamspace): TeamspaceResponseDto {
    const dto = new TeamspaceResponseDto();

    dto.id = teamspace.getId();
    dto.workspaceId = teamspace.getWorkspaceId();
    dto.name = teamspace.getName();
    dto.slug = teamspace.getSlug();
    dto.description = teamspace.getDescription();
    dto.icon = teamspace.getIcon();
    dto.visibility = teamspace.getVisibility();
    dto.createdBy = teamspace.getCreatedBy();
    dto.createdAt = teamspace.getCreatedAt();
    dto.updatedAt = teamspace.getUpdatedAt();

    return dto;
  }
}
