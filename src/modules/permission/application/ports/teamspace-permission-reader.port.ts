import { TeamspaceRole } from 'src/modules/workspace/domain/enums/teamspace-role.enum';
import { TeamspaceVisibility } from 'src/modules/workspace/domain/enums/teamspace-visibility.enum';

export interface TeamspacePermissionResource {
  id: string;
  workspaceId: string;
  visibility: TeamspaceVisibility;
}

export interface TeamspacePermissionSubject {
  teamspaceId: string;
  workspaceMemberId: string;
  workspaceId: string;
  role: TeamspaceRole;
}

export interface TeamspacePermissionReader {
  findTeamspace(
    teamspaceId: string,
  ): Promise<TeamspacePermissionResource | null>;

  findMembership(
    teamspaceId: string,
    userId: string,
  ): Promise<TeamspacePermissionSubject | null>;
}
