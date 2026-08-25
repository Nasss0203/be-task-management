// src/modules/notifications/domain/entities/notification.entity.ts

import { User } from 'src/modules/identity/identity.types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  // System
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  ACCOUNT_SECURITY = 'ACCOUNT_SECURITY',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',

  // Workspace
  WORKSPACE_INVITE = 'WORKSPACE_INVITE',
  WORKSPACE_INVITE_ACCEPTED = 'WORKSPACE_INVITE_ACCEPTED',
  WORKSPACE_MEMBER_JOINED = 'WORKSPACE_MEMBER_JOINED',
  WORKSPACE_MEMBER_REMOVED = 'WORKSPACE_MEMBER_REMOVED',

  // Project
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',

  // Task
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',

  // Sprint
  SPRINT_STARTED = 'SPRINT_STARTED',
  SPRINT_COMPLETED = 'SPRINT_COMPLETED',
  SPRINT_DUE_SOON = 'SPRINT_DUE_SOON',
  SPRINT_OVERDUE = 'SPRINT_OVERDUE',

  // Comment
  COMMENT_MENTION = 'COMMENT_MENTION',
  COMMENT_REPLY = 'COMMENT_REPLY',
}

@Entity('notifications')
@Index('IDX_notifications_receiver_created_at', ['receiverId', 'createdAt'])
@Index('IDX_notifications_receiver_read_at', ['receiverId', 'readAt'])
@Index('IDX_notifications_workspace_id', ['workspaceId'])
@Index('IDX_notifications_project_id', ['projectId'])
@Index('IDX_notifications_task_id', ['taskId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Người nhận notification
   */
  @Column({ name: 'receiver_id', type: 'uuid' })
  receiverId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  /**
   * SYSTEM hoặc USER
   */
  @Column({
    name: 'sender_type',
    type: 'enum',
    enum: NotificationSenderType,
    default: NotificationSenderType.SYSTEM,
  })
  senderType: NotificationSenderType;

  /**
   * Người tạo ra notification.
   * Nếu notification từ system thì actorId = null.
   */
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;

  /**
   * Notification này thuộc nhóm nào.
   * Ví dụ SYSTEM, WORKSPACE, TASK, COMMENT.
   */
  @Column({
    name: 'source_type',
    type: 'enum',
    enum: NotificationSourceType,
    default: NotificationSourceType.SYSTEM,
  })
  sourceType: NotificationSourceType;

  /**
   * Context nullable.
   * Không phải notification nào cũng có workspace/project/task.
   */
  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId: string | null;

  @Column({ name: 'sprint_id', type: 'uuid', nullable: true })
  sprintId: string | null;

  @Column({ name: 'comment_id', type: 'uuid', nullable: true })
  commentId: string | null;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  /**
   * URL frontend dùng để click vào notification.
   * Ví dụ:
   * /workspaces/:workspaceId/projects/:projectId/tasks/:taskId
   */
  @Column({ name: 'action_url', type: 'text', nullable: true })
  actionUrl: string | null;

  /**
   * Dữ liệu phụ.
   * Ví dụ:
   * {
   *   workspaceName: "...",
   *   taskTitle: "...",
   *   inviteId: "...",
   *   inviteToken: "..."
   * }
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ name: 'archived_at', type: 'timestamp', nullable: true })
  archivedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
