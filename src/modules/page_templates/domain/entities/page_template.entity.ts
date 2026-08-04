// src/modules/page_templates/domain/entities/page-template.entity.ts

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TemplateStatus,
  TemplateVisibility,
} from 'src/common/enum/template.enum';

@Entity('page_templates')
@Index(['workspaceId'])
@Index(['workspaceId', 'name'])
@Index(['createdBy'])
@Index(['isSystem'])
@Index(['status', 'visibility'])
export class PageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ name: 'cover_url', type: 'text', nullable: true })
  coverUrl: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.DRAFT,
  })
  status: TemplateStatus;

  @Column({
    type: 'enum',
    enum: TemplateVisibility,
    default: TemplateVisibility.PRIVATE,
  })
  visibility: TemplateVisibility;

  @Column({ name: 'use_count', type: 'int', default: 0 })
  useCount: number;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
