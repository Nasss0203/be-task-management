export interface BillingQueryApplication {
  getPlans(): Promise<unknown[]>;

  getPlanById(planId: string): Promise<unknown>;

  getCurrentSubscription(userId: string): Promise<unknown>;

  getWorkspaceUsageLimits(
    userId: string,
    workspaceId: string,
  ): Promise<unknown[]>;
}
