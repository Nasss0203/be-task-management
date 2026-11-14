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
  applications: {
    GetGoogleCalendarAuthorizeUrlHandler: Symbol(
      'GetGoogleCalendarAuthorizeUrlHandler',
    ),
    GetGoogleCalendarSyncHandler: Symbol('GetGoogleCalendarSyncHandler'),
    ConnectGoogleCalendarHandler: Symbol('ConnectGoogleCalendarHandler'),
    DisconnectGoogleCalendarHandler: Symbol('DisconnectGoogleCalendarHandler'),
    UpsertGoogleCalendarSyncHandler: Symbol('UpsertGoogleCalendarSyncHandler'),
    DeleteGoogleCalendarSyncHandler: Symbol('DeleteGoogleCalendarSyncHandler'),
    RequestGoogleCalendarSyncHandler: Symbol(
      'RequestGoogleCalendarSyncHandler',
    ),
    RunGoogleCalendarSyncHandler: Symbol('RunGoogleCalendarSyncHandler'),
  },
  services: {
    GoogleCalendarAccessTokenService: Symbol(
      'GoogleCalendarAccessTokenService',
    ),
  },
} as const;
