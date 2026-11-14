export type SubscriptionExpiryCandidate = {
  subscriptionId: string;
  workspaceInTrash: boolean;
};

export type SubscriptionNoticeDetails = {
  recipientEmail: string;
  recipientName: string;
  workspaceName: string;
  planName: string;
};

export interface SubscriptionExpiryReader {
  findDue(now: Date): Promise<SubscriptionExpiryCandidate[]>;

  findNoticeDetails(input: {
    workspaceId: string;
    planId: string;
    recipientUserId: string;
  }): Promise<SubscriptionNoticeDetails | null>;
}
