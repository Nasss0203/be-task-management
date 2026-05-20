export const NOTIFICATION_TYPES = {
  applications: {
    CreateNotificationApplication: Symbol('CreateNotificationApplication'),
    FindNotificationApplication: Symbol('FindNotificationApplication'),
  },

  services: {
    CreateNotificationService: Symbol('CreateNotificationService'),
    FindNotificationService: Symbol('FindNotificationService'),
  },

  repositories: {
    CreateNotificationRepository: Symbol('CreateNotificationRepository'),
    FindNotificationRepository: Symbol('FindNotificationRepository'),
  },
};
