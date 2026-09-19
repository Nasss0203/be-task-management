export enum MentionSourceType {
  TASK_COMMENT = 'TASK_COMMENT',
  PAGE_COMMENT = 'PAGE_COMMENT',
  PAGE_BLOCK = 'PAGE_BLOCK',
}

export enum MentionEntityType {
  TASK = 'TASK',
  PAGE = 'PAGE',
  PAGE_BLOCK = 'PAGE_BLOCK',
}

export interface MentionModel {
  id: string;
  workspaceId: string;
  projectId: string | null;
  mentionerId: string;
  mentionedUserId: string;
  sourceType: MentionSourceType;
  sourceId: string;
  entityType: MentionEntityType;
  entityId: string;
  notificationId: string | null;
  createdAt: Date;
}
