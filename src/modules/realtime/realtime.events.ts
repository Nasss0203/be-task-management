export const REALTIME_EVENTS = {
  NOTIFICATION_CREATED: 'notification.created',
  TASK_UPDATED: 'task.updated',
  COMMENT_CREATED: 'comment.created',
} as const;

export type NotificationCreatedPayload = {
  recipientUserId: string;
  notification: {
    id: string;
    type: string;
    title: string;
    message?: string | null;
    actionUrl?: string | null;

    senderType?: string | null;
    actorId?: string | null;

    sourceType?: string | null;

    workspaceId?: string | null;
    projectId?: string | null;
    taskId?: string | null;
    sprintId?: string | null;
    commentId?: string | null;

    metadata?: Record<string, any> | null;

    isRead: boolean;
    readAt?: Date | null;
    archivedAt?: Date | null;

    createdAt: Date;
  };
};

export type TaskUpdatedPayload = {
  workspaceId: string;
  projectId: string;
  task: any;
};

export type CommentCreatedPayload = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  comment: any;
};
