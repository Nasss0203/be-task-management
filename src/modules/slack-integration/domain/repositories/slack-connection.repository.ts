export const SlackConnectionError = {
  ACCESS_REVOKED: 'ACCESS_REVOKED',
} as const;

export type SlackConnectionError =
  (typeof SlackConnectionError)[keyof typeof SlackConnectionError];

export const SlackDeliveryError = {
  RATE_LIMITED: 'RATE_LIMITED',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
} as const;

export type SlackDeliveryError =
  (typeof SlackDeliveryError)[keyof typeof SlackDeliveryError];

export interface SlackConnection {
  id: string;
  userId: string;
  slackTeamId: string;
  slackTeamName: string;
  slackUserId: string;
  botTokenEncrypted: string;
  lastError: SlackConnectionError | null;
  lastDeliveredAt: Date | null;
  lastDeliveryFailedAt: Date | null;
  lastDeliveryError: SlackDeliveryError | null;
  grantedScopes: string[] | null;
}

export interface SlackConnectionRepository {
  findByUserId(userId: string): Promise<SlackConnection | null>;
  findBySlackUser(
    slackTeamId: string,
    slackUserId: string,
  ): Promise<SlackConnection | null>;
  save(connection: SlackConnection): Promise<void>;
  markError(id: string, error: SlackConnectionError | null): Promise<void>;
  markDelivered(id: string, deliveredAt: Date): Promise<void>;
  markDeliveryFailed(
    id: string,
    failedAt: Date,
    error: SlackDeliveryError,
  ): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
