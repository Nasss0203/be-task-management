export const DATABASE_TYPES = {
  repositories: {
    DatabaseRepository: Symbol('DatabaseRepository'),
    DatabaseRowRepository: Symbol('DatabaseRowRepository'),
    DatabaseViewRepository: Symbol('DatabaseViewRepository'),
  },
  ports: {
    DatabaseProvisioning: Symbol('DatabaseProvisioning'),
    DatabaseSnapshotReader: Symbol('DatabaseSnapshotReader'),
  },
} as const;
