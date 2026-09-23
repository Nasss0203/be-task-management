import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export interface WorkspacePermissionSubject {
  workspaceId: string;
  userId: string;
  membershipType: WorkspaceMembershipType;
  role: WorkspaceRole | null;
}

export interface WorkspacePermissionReader {
  findMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspacePermissionSubject | null>;
}
