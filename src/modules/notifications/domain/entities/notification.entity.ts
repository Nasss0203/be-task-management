export enum NotificationSenderType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
}

export enum NotificationSourceType {
  SYSTEM = 'SYSTEM',
  ACCOUNT = 'ACCOUNT',
  WORKSPACE = 'WORKSPACE',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  SPRINT = 'SPRINT',
  COMMENT = 'COMMENT',
}

export enum NotificationType {
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  ACCOUNT_SECURITY = 'ACCOUNT_SECURITY',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  WORKSPACE_INVITE = 'WORKSPACE_INVITE',
  WORKSPACE_INVITE_ACCEPTED = 'WORKSPACE_INVITE_ACCEPTED',
  WORKSPACE_MEMBER_JOINED = 'WORKSPACE_MEMBER_JOINED',
  WORKSPACE_MEMBER_REMOVED = 'WORKSPACE_MEMBER_REMOVED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  SPRINT_STARTED = 'SPRINT_STARTED',
  SPRINT_COMPLETED = 'SPRINT_COMPLETED',
  SPRINT_DUE_SOON = 'SPRINT_DUE_SOON',
  SPRINT_OVERDUE = 'SPRINT_OVERDUE',
  COMMENT_MENTION = 'COMMENT_MENTION',
  COMMENT_REPLY = 'COMMENT_REPLY',
}

export class NotificationModel {
  constructor(
    public readonly id: string,

    public readonly receiverId: string,

    public readonly senderType: NotificationSenderType,
    public readonly actorId: string | null,

    public readonly sourceType: NotificationSourceType,

    public readonly workspaceId: string | null,
    public readonly projectId: string | null,
    public readonly taskId: string | null,
    public readonly sprintId: string | null,
    public readonly commentId: string | null,

    public readonly type: NotificationType,

    public readonly title: string,
    public readonly message: string | null,
    public readonly actionUrl: string | null,

    public readonly metadata: Record<string, any> | null,

    public readonly readAt: Date | null,
    public readonly archivedAt: Date | null,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
