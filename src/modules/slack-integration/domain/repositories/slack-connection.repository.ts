export const SlackConnectionError = {
  ACCESS_REVOKED: 'ACCESS_REVOKED',
} as const;

export type SlackConnectionError =
  (typeof SlackConnectionError)[keyof typeof SlackConnectionError];

export interface SlackConnection {
  id: string;
  userId: string;
  slackTeamId: string;
  slackTeamName: string;
  slackUserId: string;
  botTokenEncrypted: string;
  lastError: SlackConnectionError | null;
}

export interface SlackConnectionRepository {
  findByUserId(userId: string): Promise<SlackConnection | null>;
  findBySlackUser(
    slackTeamId: string,
    slackUserId: string,
  ): Promise<SlackConnection | null>;
  save(connection: SlackConnection): Promise<void>;
  markError(id: string, error: SlackConnectionError | null): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
