// src/modules/mentions/domain/entities/mention.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

@Entity('mentions')
@Index(['workspaceId', 'mentionedUserId'])
@Index(['workspaceId', 'sourceType', 'sourceId'])
@Index(['entityType', 'entityId'])
@Index(['notificationId'])
export class Mention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @Column({ name: 'mentioner_id', type: 'uuid' })
  mentionerId: string;

  @Column({ name: 'mentioned_user_id', type: 'uuid' })
  mentionedUserId: string;

  @Column({
    name: 'source_type',
    type: 'enum',
    enum: MentionSourceType,
  })
  sourceType: MentionSourceType;

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId: string;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: MentionEntityType,
  })
  entityType: MentionEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'notification_id', type: 'uuid', nullable: true })
  notificationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
