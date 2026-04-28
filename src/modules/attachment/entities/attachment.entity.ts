// src/modules/attachments/domain/entities/attachment.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AttachmentProvider {
  R2 = 'R2',
  CLOUDINARY = 'CLOUDINARY',
}

export enum AttachmentStatus {
  READY = 'READY',
  FAILED = 'FAILED',
}

@Entity('attachments')
@Index(['workspaceId', 'taskId'])
@Index(['workspaceId', 'commentId'])
@Index(['storageKey'])
@Index(['publicId'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId: string | null;

  @Column({ name: 'comment_id', type: 'uuid', nullable: true })
  commentId: string | null;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 150 })
  mimeType: string;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  size: number;

  /**
   * Cho biết file đang lưu ở đâu:
   * - R2
   * - CLOUDINARY
   */
  @Column({
    type: 'enum',
    enum: AttachmentProvider,
    default: AttachmentProvider.R2,
  })
  provider: AttachmentProvider;

  /**
   * Dùng cho R2
   * Ví dụ:
   * workspaces/ws-id/tasks/task-id/uuid-file.pdf
   */
  @Column({ name: 'storage_key', type: 'text', nullable: true })
  storageKey: string | null;

  /**
   * Dùng cho Cloudinary
   * Ví dụ:
   * task-management/workspaces/ws-id/tasks/task-id/avatar_xxx
   */
  @Column({ name: 'public_id', type: 'text', nullable: true })
  publicId: string | null;

  /**
   * URL Cloudinary thường
   */
  @Column({ name: 'url', type: 'text', nullable: true })
  url: string | null;

  /**
   * HTTPS URL Cloudinary
   */
  @Column({ name: 'secure_url', type: 'text', nullable: true })
  secureUrl: string | null;

  @Column({
    type: 'enum',
    enum: AttachmentStatus,
    default: AttachmentStatus.READY,
  })
  status: AttachmentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
