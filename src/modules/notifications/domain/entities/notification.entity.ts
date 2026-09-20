export enum NotificationSenderType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
}

export const NotificationSourceType = {
  SYSTEM: 'system',
  ACCOUNT: 'account',
  WORKSPACE: 'workspace',
  PAGE: 'page',
  PAGE_BLOCK: 'page_block',
  COMMENT: 'comment',
} as const;

export type NotificationSourceType =
  (typeof NotificationSourceType)[keyof typeof NotificationSourceType];

export const NotificationType = {
  SYSTEM_ANNOUNCEMENT: 'system.announcement',
  SYSTEM_MAINTENANCE: 'system.maintenance',

  ACCOUNT_SECURITY: 'account.security',
  PASSWORD_CHANGED: 'account.password_changed',
  EMAIL_VERIFIED: 'account.email_verified',

  WORKSPACE_INVITE: 'workspace.invite',
  WORKSPACE_INVITE_ACCEPTED: 'workspace.invite_accepted',
  WORKSPACE_MEMBER_JOINED: 'workspace.member_joined',
  WORKSPACE_MEMBER_REMOVED: 'workspace.member_removed',

  PAGE_ACCESS_REQUESTED: 'page.access.requested',
  PAGE_ACCESS_APPROVED: 'page.access.approved',
  PAGE_ACCESS_REJECTED: 'page.access.rejected',

  COMMENT_MENTIONED: 'comment.mentioned',
  COMMENT_REPLIED: 'comment.replied',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export class NotificationModel {
  constructor(
    public readonly id: string,
    public readonly receiverId: string,

    public readonly senderType: NotificationSenderType,
    public readonly actorId: string | null,

    public readonly sourceType: NotificationSourceType,
    public readonly sourceId: string | null,

    public readonly workspaceId: string | null,

    public readonly type: NotificationType,

    public readonly title: string,
    public readonly message: string | null,
    public readonly actionUrl: string | null,

    public readonly metadata: Record<string, unknown> | null,

    public readonly readAt: Date | null,
    public readonly archivedAt: Date | null,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
