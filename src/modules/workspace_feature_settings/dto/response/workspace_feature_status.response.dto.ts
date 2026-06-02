export class WorkspaceFeatureStatusResponseDto {
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  planEnabled: boolean;
  workspaceEnabled: boolean | null;
  enabled: boolean;
  metadata: Record<string, unknown> | null;
}
