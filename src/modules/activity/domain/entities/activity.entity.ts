import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ActivityEntityType {
  TASK = 'TASK',
  SPRINT = 'SPRINT',
  COMMENT = 'COMMENT',
  ATTACHMENT = 'ATTACHMENT',
  PAGE = 'PAGE',
  PAGE_BLOCK = 'PAGE_BLOCK',
  WORKSPACE = 'WORKSPACE',
  PROJECT = 'PROJECT',
}

export enum ActivityAction {
  // Task
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_RESTORED = 'TASK_RESTORED',

  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_PRIORITY_CHANGED = 'TASK_PRIORITY_CHANGED',
  TASK_TITLE_CHANGED = 'TASK_TITLE_CHANGED',
  TASK_DESCRIPTION_CHANGED = 'TASK_DESCRIPTION_CHANGED',
  TASK_DUE_DATE_CHANGED = 'TASK_DUE_DATE_CHANGED',
  TASK_START_DATE_CHANGED = 'TASK_START_DATE_CHANGED',
  TASK_ESTIMATE_CHANGED = 'TASK_ESTIMATE_CHANGED',

  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UNASSIGNED = 'TASK_UNASSIGNED',

  TASK_MOVED_TO_SPRINT = 'TASK_MOVED_TO_SPRINT',
  TASK_REMOVED_FROM_SPRINT = 'TASK_REMOVED_FROM_SPRINT',
  TASK_MOVED_TO_BACKLOG = 'TASK_MOVED_TO_BACKLOG',

  // Sprint
  SPRINT_CREATED = 'SPRINT_CREATED',
  SPRINT_UPDATED = 'SPRINT_UPDATED',
  SPRINT_STARTED = 'SPRINT_STARTED',
  SPRINT_COMPLETED = 'SPRINT_COMPLETED',
  SPRINT_CANCELLED = 'SPRINT_CANCELLED',
  SPRINT_DELETED = 'SPRINT_DELETED',
  SPRINT_RESTORED = 'SPRINT_RESTORED',

  // Comment
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED',

  // Attachment
  ATTACHMENT_UPLOADED = 'ATTACHMENT_UPLOADED',
  ATTACHMENT_DELETED = 'ATTACHMENT_DELETED',

  // Page
  PAGE_CREATED = 'PAGE_CREATED',
  PAGE_UPDATED = 'PAGE_UPDATED',
  PAGE_DELETED = 'PAGE_DELETED',
  PAGE_RESTORED = 'PAGE_RESTORED',

  PAGE_BLOCK_CREATED = 'PAGE_BLOCK_CREATED',
  PAGE_BLOCK_UPDATED = 'PAGE_BLOCK_UPDATED',
  PAGE_BLOCK_DELETED = 'PAGE_BLOCK_DELETED',
  PAGE_BLOCK_REORDERED = 'PAGE_BLOCK_REORDERED',

  // Workspace / Project
  WORKSPACE_MEMBER_JOINED = 'WORKSPACE_MEMBER_JOINED',
  WORKSPACE_MEMBER_REMOVED = 'WORKSPACE_MEMBER_REMOVED',
  WORKSPACE_MEMBER_ROLE_CHANGED = 'WORKSPACE_MEMBER_ROLE_CHANGED',

  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  PROJECT_RESTORED = 'PROJECT_RESTORED',
}

@Entity('activities')
@Index(['workspaceId', 'entityType', 'entityId'])
@Index(['workspaceId', 'projectId'])
@Index(['workspaceId', 'createdAt'])
@Index(['actorId'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: ActivityEntityType,
  })
  entityType: ActivityEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({
    name: 'action',
    type: 'enum',
    enum: ActivityAction,
  })
  action: ActivityAction;

  @Column({ name: 'field', type: 'varchar', length: 100, nullable: true })
  field: string | null;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: unknown | null;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: unknown | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
