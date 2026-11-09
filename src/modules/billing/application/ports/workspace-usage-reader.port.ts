export type UsagePeriod = {
  start: Date;
  end: Date;
};

export type WorkspaceUsage = {
  members: number;
  teamspaces: number;
  storageBytes: number;
  aiRequests: number;
};

export interface WorkspaceUsageReader {
  getUsage(
    workspaceId: string,
    aiPeriod: UsagePeriod,
    now: Date,
  ): Promise<WorkspaceUsage>;
}
