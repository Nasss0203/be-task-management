export const NOTIFICATION_CREATED_EVENT = 'notification.created';

export interface NotificationCreatedEvent {
  recipientUserId: string;
  notification: {
    id: string;
    type: string;
    title: string;
    message: string | null;
    actionUrl: string | null;
    workspaceId: string | null;
    sourceType: string;
    sourceId: string | null;
    metadata: Record<string, unknown> | null;
  };
}
