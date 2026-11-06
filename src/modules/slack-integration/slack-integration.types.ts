export const SLACK_INTEGRATION_TYPES = {
  repositories: {
    SlackConnectionRepository: Symbol('SlackConnectionRepository'),
  },
  ports: {
    SlackClient: Symbol('SlackClient'),
    SlackDeliveryQueue: Symbol('SlackDeliveryQueue'),
  },
  applications: {
    GetSlackAuthorizeUrlHandler: Symbol('GetSlackAuthorizeUrlHandler'),
    GetSlackStatusHandler: Symbol('GetSlackStatusHandler'),
    ConnectSlackHandler: Symbol('ConnectSlackHandler'),
    DisconnectSlackHandler: Symbol('DisconnectSlackHandler'),
    DeliverSlackNotificationHandler: Symbol('DeliverSlackNotificationHandler'),
  },
} as const;
