export interface BillingQueryApplication {
  getCurrentSubscription(userId: string): Promise<unknown>;

  getWorkspaceUsageLimits(
    userId: string,
    workspaceId: string,
  ): Promise<unknown[]>;
}
