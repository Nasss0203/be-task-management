export class BulkDeleteWorkspaceFilesCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly attachmentIds: string[],
  ) {}
}
