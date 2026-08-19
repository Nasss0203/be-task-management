import type { UpdateWorkspaceLayoutModeDto } from 'src/modules/workspace/application/dto/workspace/update-workspace-layout-mode.dto';

export class UpdateWorkspaceLayoutModeCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly dto: UpdateWorkspaceLayoutModeDto,
  ) {}
}
