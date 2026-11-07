export const ACTIVITY_TYPES = {
  services: {
    CreateActivityService: 'CreateActivityService',
  },
  repositories: {
    ActivityRepository: Symbol('ActivityRepository'),
  },
  ports: {
    PageActivityDetailsReader: Symbol('PageActivityDetailsReader'),
  },
} as const;
