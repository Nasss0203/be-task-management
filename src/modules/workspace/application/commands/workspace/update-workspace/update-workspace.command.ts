import type { UpdateWorkspaceDto } from 'src/modules/workspace/application/dto/workspace/update-workspace.dto';

export class UpdateWorkspaceCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly dto: UpdateWorkspaceDto,
  ) {}
}
