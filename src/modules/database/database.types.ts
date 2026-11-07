export const DATABASE_TYPES = {
  repositories: {
    DatabaseRepository: Symbol('DatabaseRepository'),
    DatabaseRowRepository: Symbol('DatabaseRowRepository'),
    DatabaseViewRepository: Symbol('DatabaseViewRepository'),
    CalendarFeedRepository: Symbol('CalendarFeedRepository'),
  },
  ports: {
    DatabaseProvisioning: Symbol('DatabaseProvisioning'),
    DatabaseSnapshotReader: Symbol('DatabaseSnapshotReader'),
    DatabasePeopleReader: Symbol('DatabasePeopleReader'),
    DatabaseActivityRecorder: Symbol('DatabaseActivityRecorder'),
  },
} as const;
