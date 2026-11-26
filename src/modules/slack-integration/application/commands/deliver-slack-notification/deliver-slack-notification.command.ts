import type { NotificationCreatedEvent } from 'src/modules/notifications/application/services/notification-created.event';

export class DeliverSlackNotificationCommand {
  constructor(
    public readonly event: NotificationCreatedEvent,
    public readonly attempt: number = 1,
  ) {}
}
