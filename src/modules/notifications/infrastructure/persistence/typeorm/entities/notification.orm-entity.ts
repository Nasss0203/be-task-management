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

import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../../../../domain/entities/notification.entity';

@Entity('notifications')
@Index('IDX_notifications_receiver_created_at', ['receiverId', 'createdAt'])
@Index('IDX_notifications_receiver_read_at', ['receiverId', 'readAt'])
@Index('IDX_notifications_workspace_id', ['workspaceId'])
@Index('IDX_notifications_source', ['sourceType', 'sourceId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Người nhận notification.
   */
  @Column({
    name: 'receiver_id',
    type: 'uuid',
  })
  receiverId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'receiver_id',
  })
  receiver: User;

  /**
   * Nguồn gửi notification.
   *
   * SYSTEM:
   * - notification do hệ thống tạo.
   *
   * USER:
   * - notification phát sinh từ hành động của user khác.
   */
  @Column({
    name: 'sender_type',
    type: 'enum',
    enum: NotificationSenderType,
    default: NotificationSenderType.SYSTEM,
  })
  senderType: NotificationSenderType;

  /**
   * User gây ra notification.
   *
   * Nếu senderType = SYSTEM thì actorId thường là null.
   */
  @Column({
    name: 'actor_id',
    type: 'uuid',
    nullable: true,
  })
  actorId: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'actor_id',
  })
  actor: User | null;

  /**
   * Loại resource tạo ra notification.
   *
   * Ví dụ:
   * - system
   * - account
   * - workspace
   * - page
   * - page_block
   * - comment
   *
   * Dùng varchar thay vì PostgreSQL enum để có thể
   * bổ sung source mới mà không phải migration DB.
   */
  @Column({
    name: 'source_type',
    type: 'varchar',
    length: 64,
    default: NotificationSourceType.SYSTEM,
  })
  sourceType: NotificationSourceType;

  /**
   * ID của resource tương ứng với sourceType.
   *
   * Ví dụ:
   *
   * sourceType = page
   * sourceId   = pageId
   *
   * sourceType = workspace
   * sourceId   = workspaceId
   *
   * sourceType = system
   * sourceId   = null
   */
  @Column({
    name: 'source_id',
    type: 'uuid',
    nullable: true,
  })
  sourceId: string | null;

  /**
   * Workspace scope.
   *
   * Giữ riêng workspaceId để:
   * - filter notification theo workspace
   * - query nhanh hơn
   * - không cần parse metadata
   *
   * Notification không thuộc workspace có thể để null.
   */
  @Column({
    name: 'workspace_id',
    type: 'uuid',
    nullable: true,
  })
  workspaceId: string | null;

  /**
   * Business event của notification.
   *
   * Ví dụ:
   * - page.access.requested
   * - page.access.approved
   * - workspace.invite
   *
   * Dùng varchar để thêm NotificationType mới
   * mà không phải migration PostgreSQL enum.
   */
  @Column({
    name: 'type',
    type: 'varchar',
    length: 100,
  })
  type: NotificationType;

  @Column({
    type: 'varchar',
    length: 255,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  message: string | null;

  /**
   * URL frontend điều hướng khi user click notification.
   *
   * Ví dụ:
   * /pages/:pageId
   */
  @Column({
    name: 'action_url',
    type: 'text',
    nullable: true,
  })
  actionUrl: string | null;

  /**
   * Dữ liệu phụ dành riêng cho từng notification.
   *
   * Không nên dùng metadata để thay thế các field
   * cần filter/query thường xuyên như:
   * - receiverId
   * - workspaceId
   * - sourceType
   * - sourceId
   *
   * Ví dụ Page Access Request:
   *
   * {
   *   accessRequestId: "...",
   *   requesterId: "..."
   * }
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, unknown> | null;

  /**
   * null = chưa đọc.
   */
  @Column({
    name: 'read_at',
    type: 'timestamp',
    nullable: true,
  })
  readAt: Date | null;

  /**
   * Cho phép ẩn/archive notification
   * mà không cần xóa dữ liệu.
   */
  @Column({
    name: 'archived_at',
    type: 'timestamp',
    nullable: true,
  })
  archivedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;
}
