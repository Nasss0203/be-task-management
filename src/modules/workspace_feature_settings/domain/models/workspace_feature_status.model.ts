export class WorkspaceFeatureStatusModel {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly category: string | null,
    public readonly planEnabled: boolean,
    public readonly workspaceEnabled: boolean | null,
    public readonly enabled: boolean,
    public readonly metadata: Record<string, unknown> | null,
  ) {}
}
