import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export interface WorkspacePermissionSubject {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}

export interface WorkspacePermissionReader {
  findMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspacePermissionSubject | null>;
}
