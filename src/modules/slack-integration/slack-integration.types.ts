export const SLACK_INTEGRATION_TYPES = {
  repositories: {
    SlackConnectionRepository: Symbol('SlackConnectionRepository'),
    SlackDeliveryLog: Symbol('SlackDeliveryLog'),
  },
  ports: {
    SlackClient: Symbol('SlackClient'),
    SlackDeliveryQueue: Symbol('SlackDeliveryQueue'),
    SlackUnfurlQueue: Symbol('SlackUnfurlQueue'),
    SlackSubmissionLock: Symbol('SlackSubmissionLock'),
  },
  applications: {
    GetSlackAuthorizeUrlHandler: Symbol('GetSlackAuthorizeUrlHandler'),
    GetSlackStatusHandler: Symbol('GetSlackStatusHandler'),
    ListSlackDeliveriesHandler: Symbol('ListSlackDeliveriesHandler'),
    ConnectSlackHandler: Symbol('ConnectSlackHandler'),
    DisconnectSlackHandler: Symbol('DisconnectSlackHandler'),
    DeliverSlackNotificationHandler: Symbol('DeliverSlackNotificationHandler'),
    OpenSlackReplyHandler: Symbol('OpenSlackReplyHandler'),
    ReplyFromSlackHandler: Symbol('ReplyFromSlackHandler'),
    SearchSlackPagesHandler: Symbol('SearchSlackPagesHandler'),
    UnfurlSlackLinksHandler: Symbol('UnfurlSlackLinksHandler'),
  },
} as const;
