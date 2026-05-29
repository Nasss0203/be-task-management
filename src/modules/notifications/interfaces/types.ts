export const NOTIFICATION_TYPES = {
  applications: {
    CreateNotificationApplication: Symbol('CreateNotificationApplication'),
    FindNotificationApplication: Symbol('FindNotificationApplication'),
  },

  services: {
    CreateNotificationService: Symbol('CreateNotificationService'),
    FindNotificationService: Symbol('FindNotificationService'),
    UpdateNotificationService: Symbol('UpdateNotificationService'),
  },

  repositories: {
    CreateNotificationRepository: Symbol('CreateNotificationRepository'),
    FindNotificationRepository: Symbol('FindNotificationRepository'),
    UpdateNotificationRepository: Symbol('UpdateNotificationRepository'),
  },
};
