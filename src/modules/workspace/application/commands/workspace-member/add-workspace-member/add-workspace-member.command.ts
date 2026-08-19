import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export class AddWorkspaceMemberCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly roleName: WorkspaceRole,
    public readonly addedBy: string,
  ) {}
}
