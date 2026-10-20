import { WorkspaceStarter } from 'src/modules/workspace/domain/enums/workspace-starter.enum';

export class CreateWorkspaceCommand {
  constructor(
    public readonly userId: string,
    public readonly name: string | undefined,
    public readonly starter: WorkspaceStarter = WorkspaceStarter.BLANK,
  ) {}
}
