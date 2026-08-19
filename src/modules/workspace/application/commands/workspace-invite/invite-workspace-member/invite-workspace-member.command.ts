import type { CreateWorkspaceInviteDto } from 'src/modules/workspace/application/dto/workspace-invite/create-workspace-invite.dto';

export class InviteWorkspaceMemberCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly invitedBy: string,
    public readonly dto: CreateWorkspaceInviteDto,
  ) {}
}
