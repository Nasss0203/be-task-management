import type { EntityManager } from 'typeorm';
import type { CreateWorkspaceDto } from 'src/modules/workspace/application/dto/workspace/create-workspace.dto';

export class CreateWorkspaceCommand {
  constructor(
    public readonly userId: string,
    public readonly createWorkspaceDto?: CreateWorkspaceDto,
    public readonly manager?: EntityManager,
  ) {}
}
