export const CALENDAR_SYNC_TYPES = {
  repositories: {
    GoogleCalendarConnectionRepository: Symbol(
      'GoogleCalendarConnectionRepository',
    ),
    GoogleCalendarSyncRepository: Symbol('GoogleCalendarSyncRepository'),
  },
  ports: {
    GoogleCalendarClient: Symbol('GoogleCalendarClient'),
    GoogleCalendarSyncJobQueue: Symbol('GoogleCalendarSyncJobQueue'),
  },
} as const;
