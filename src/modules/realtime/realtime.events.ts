export const REALTIME_EVENTS = {
  NOTIFICATION_CREATED: 'notification.created',
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  SPRINT_CREATED: 'sprint.created',
  SPRINT_UPDATED: 'sprint.updated',
  SPRINT_DELETED: 'sprint.deleted',
  COMMENT_CREATED: 'comment.created',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted',
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

export type TaskPayload = {
  workspaceId: string;
  projectId: string;
  task: any; // Using any for simplicity in event forwarding
};

export type TaskCreatedPayload = TaskPayload;
export type TaskUpdatedPayload = TaskPayload;
export type TaskDeletedPayload = {
  workspaceId: string;
  projectId: string;
  taskId: string;
};

export type SprintPayload = {
  workspaceId: string;
  projectId: string;
  sprint: any;
};

export type SprintCreatedPayload = SprintPayload;
export type SprintUpdatedPayload = SprintPayload;
export type SprintDeletedPayload = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
};

export type CommentPayload = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  comment: any;
};

export type CommentCreatedPayload = CommentPayload;
export type CommentUpdatedPayload = CommentPayload;
export type CommentDeletedPayload = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  commentId: string;
};
