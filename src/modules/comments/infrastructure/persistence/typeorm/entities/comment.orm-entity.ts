import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { User } from 'src/modules/identity/identity.types';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CommentTargetType } from '../../../../domain/enums/comment-target-type.enum';

@Entity('comments')
@Index('IDX_comments_target', ['targetType', 'targetId', 'createdAt'])
@Index('IDX_comments_page_id', ['pageId'])
@Index('IDX_comments_parent_comment_id', ['parentCommentId'])
export class CommentOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => WorkspaceOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'workspace_id',
    foreignKeyConstraintName: 'FK_comments_workspace_id',
  })
  workspace: WorkspaceOrmEntity;

  @Column({ name: 'page_id', type: 'uuid' })
  pageId: string;

  // Xóa vĩnh viễn page thì comment của page, block và row trong page đi theo
  @ManyToOne(() => PageOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'page_id',
    foreignKeyConstraintName: 'FK_comments_page_id',
  })
  page: PageOrmEntity;

  @Column({ name: 'target_type', type: 'enum', enum: CommentTargetType })
  targetType: CommentTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ name: 'parent_comment_id', type: 'uuid', nullable: true })
  parentCommentId: string | null;

  @ManyToOne(() => CommentOrmEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'parent_comment_id',
    foreignKeyConstraintName: 'FK_comments_parent_comment_id',
  })
  parentComment: CommentOrmEntity | null;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'author_id',
    foreignKeyConstraintName: 'FK_comments_author_id',
  })
  author: User;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'resolved_by',
    foreignKeyConstraintName: 'FK_comments_resolved_by',
  })
  resolvedByUser: User | null;

  @Column({ name: 'edited_at', type: 'timestamptz', nullable: true })
  editedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
