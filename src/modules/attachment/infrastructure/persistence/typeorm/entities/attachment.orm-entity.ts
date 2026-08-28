import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttachmentProvider } from '../../../../domain/enums/attachment-provider.enum';
import { AttachmentStatus } from '../../../../domain/enums/attachment-status.enum';

@Entity('attachments')
@Index(['workspaceId', 'taskId'])
@Index(['workspaceId', 'commentId'])
@Index(['storageKey'])
@Index(['publicId'])
export class AttachmentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId: string | null;

  @Column({ name: 'comment_id', type: 'uuid', nullable: true })
  commentId: string | null;

  @Column({
    name: 'page_block_id',
    type: 'uuid',
    nullable: true,
  })
  pageBlockId: string | null;

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

  @Column({
    type: 'enum',
    enum: AttachmentProvider,
    default: AttachmentProvider.R2,
  })
  provider: AttachmentProvider;

  @Column({ name: 'storage_key', type: 'text', nullable: true })
  storageKey: string | null;

  @Column({ name: 'public_id', type: 'text', nullable: true })
  publicId: string | null;

  @Column({ name: 'url', type: 'text', nullable: true })
  url: string | null;

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
