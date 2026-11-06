import type { NotificationCreatedEvent } from 'src/modules/notifications/application/services/notification-created.event';

export interface SlackDeliveryQueue {
  enqueue(event: NotificationCreatedEvent): Promise<void>;
}
