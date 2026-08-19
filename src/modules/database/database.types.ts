export const DATABASE_TYPES = {
  repositories: {
    DatabaseRepository: Symbol('DatabaseRepository'),
    DatabaseRowRepository: Symbol('DatabaseRowRepository'),
    DatabaseViewRepository: Symbol('DatabaseViewRepository'),
  },
} as const;
