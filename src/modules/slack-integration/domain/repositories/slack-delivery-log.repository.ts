import type {
  SlackConnectionError,
  SlackDeliveryError,
} from './slack-connection.repository';

export const SlackDeliveryStatus = {
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;

export type SlackDeliveryStatus =
  (typeof SlackDeliveryStatus)[keyof typeof SlackDeliveryStatus];

export type SlackDeliveryFailure = SlackDeliveryError | SlackConnectionError;

export interface SlackDeliveryEntry {
  userId: string;
  notificationId: string;
  notificationType: string;
  title: string;
  status: SlackDeliveryStatus;
  error: SlackDeliveryFailure | null;
  attempts: number;
  at: Date;
}

export interface SlackDelivery {
  id: string;
  notificationType: string;
  title: string;
  status: SlackDeliveryStatus;
  error: SlackDeliveryFailure | null;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlackDeliveryLog {
  record(entry: SlackDeliveryEntry): Promise<void>;
  listByUser(
    userId: string,
    cursor: string | null,
    limit: number,
  ): Promise<SlackDelivery[]>;
  deleteOlderThan(userId: string, before: Date): Promise<void>;
  deleteByUser(userId: string): Promise<void>;
}
