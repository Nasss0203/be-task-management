import type { NotificationCreatedEvent } from 'src/modules/notifications/application/services/notification-created.event';

export class DeliverSlackNotificationCommand {
  constructor(public readonly event: NotificationCreatedEvent) {}
}
