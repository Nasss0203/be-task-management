export const NOTIFICATION_TYPES = {
  services: {
    CreateNotificationService: Symbol('CreateNotificationService'),
    UpdateNotificationService: Symbol('UpdateNotificationService'),
  },

  repositories: {
    NotificationRepository: Symbol('NotificationRepository'),
  },
} as const;
