import type { CreateWorkspaceInviteLinkDto } from 'src/modules/workspace/application/dto/workspace-invite/create-workspace-invite.dto';

export class CreateWorkspaceInviteLinkCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly invitedBy: string,
    public readonly dto: CreateWorkspaceInviteLinkDto,
  ) {}
}
