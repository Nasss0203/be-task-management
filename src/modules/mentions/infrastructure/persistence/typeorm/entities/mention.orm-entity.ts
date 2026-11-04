import { User } from 'src/modules/identity/identity.types';
import { Notification } from 'src/modules/notifications/infrastructure/persistence/typeorm/entities/notification.orm-entity';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { MentionEntityType } from '../../../../domain/enums/mention-entity-type.enum';
import { MentionSourceType } from '../../../../domain/enums/mention-source-type.enum';

@Entity('mentions')
// Một người chỉ được nhắc một lần trong một comment / block, lưu lại nhiều lần không sinh trùng
@Unique('UQ_mentions_source_user', [
  'sourceType',
  'sourceId',
  'mentionedUserId',
])
@Index('IDX_mentions_workspace_mentioned_user', [
  'workspaceId',
  'mentionedUserId',
])
@Index('IDX_mentions_entity', ['entityType', 'entityId'])
@Index('IDX_mentions_notification_id', ['notificationId'])
export class MentionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => WorkspaceOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'workspace_id',
    foreignKeyConstraintName: 'FK_mentions_workspace_id',
  })
  workspace: WorkspaceOrmEntity;

  @Column({ name: 'mentioner_id', type: 'uuid' })
  mentionerId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'mentioner_id',
    foreignKeyConstraintName: 'FK_mentions_mentioner_id',
  })
  mentioner: User;

  @Column({ name: 'mentioned_user_id', type: 'uuid' })
  mentionedUserId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'mentioned_user_id',
    foreignKeyConstraintName: 'FK_mentions_mentioned_user_id',
  })
  mentionedUser: User;

  @Column({ name: 'source_type', type: 'enum', enum: MentionSourceType })
  sourceType: MentionSourceType;

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId: string;

  @Column({ name: 'entity_type', type: 'enum', enum: MentionEntityType })
  entityType: MentionEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'notification_id', type: 'uuid', nullable: true })
  notificationId: string | null;

  @ManyToOne(() => Notification, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'notification_id',
    foreignKeyConstraintName: 'FK_mentions_notification_id',
  })
  notification: Notification | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
