export const SLACK_INTEGRATION_TYPES = {
  repositories: {
    SlackConnectionRepository: Symbol('SlackConnectionRepository'),
  },
  ports: {
    SlackClient: Symbol('SlackClient'),
    SlackDeliveryQueue: Symbol('SlackDeliveryQueue'),
    SlackUnfurlQueue: Symbol('SlackUnfurlQueue'),
  },
  applications: {
    GetSlackAuthorizeUrlHandler: Symbol('GetSlackAuthorizeUrlHandler'),
    GetSlackStatusHandler: Symbol('GetSlackStatusHandler'),
    ConnectSlackHandler: Symbol('ConnectSlackHandler'),
    DisconnectSlackHandler: Symbol('DisconnectSlackHandler'),
    DeliverSlackNotificationHandler: Symbol('DeliverSlackNotificationHandler'),
    OpenSlackReplyHandler: Symbol('OpenSlackReplyHandler'),
    ReplyFromSlackHandler: Symbol('ReplyFromSlackHandler'),
    SearchSlackPagesHandler: Symbol('SearchSlackPagesHandler'),
    UnfurlSlackLinksHandler: Symbol('UnfurlSlackLinksHandler'),
  },
} as const;
