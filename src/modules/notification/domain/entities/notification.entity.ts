// src/modules/notifications/domain/entities/notification.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UNASSIGNED = 'TASK_UNASSIGNED',
  TASK_COMMENTED = 'TASK_COMMENTED',
  TASK_MENTIONED = 'TASK_MENTIONED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',

  WORKSPACE_INVITED = 'WORKSPACE_INVITED',
  WORKSPACE_MEMBER_JOINED = 'WORKSPACE_MEMBER_JOINED',

  SPRINT_STARTED = 'SPRINT_STARTED',
  SPRINT_COMPLETED = 'SPRINT_COMPLETED',

  PAGE_MENTIONED = 'PAGE_MENTIONED',
  PAGE_SHARED = 'PAGE_SHARED',

  SYSTEM = 'SYSTEM',
}

export enum NotificationEntityType {
  TASK = 'TASK',
  SPRINT = 'SPRINT',
  COMMENT = 'COMMENT',
  PAGE = 'PAGE',
  WORKSPACE = 'WORKSPACE',
  PROJECT = 'PROJECT',
  INVITE = 'INVITE',
}

@Entity('notifications')
@Index(['workspaceId', 'userId'])
@Index(['workspaceId', 'userId', 'readAt'])
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: NotificationEntityType,
    nullable: true,
  })
  entityType: NotificationEntityType | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
