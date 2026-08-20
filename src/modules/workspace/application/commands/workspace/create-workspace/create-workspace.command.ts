export class CreateWorkspaceCommand {
  constructor(
    public readonly userId: string,
    public readonly name: string,
  ) {}
}
