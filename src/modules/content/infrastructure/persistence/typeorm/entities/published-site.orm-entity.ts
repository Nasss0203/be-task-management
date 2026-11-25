import { User } from 'src/modules/identity/identity.types';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { PageOrmEntity } from './page.orm-entity';

@Entity('published_sites')
@Unique('UQ_published_sites_subdomain', ['subdomain'])
@Index('IDX_published_sites_workspace_id', ['workspace_id'])
@Index('IDX_published_sites_disabled_at', ['disabled_at'])
export class PublishedSiteOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  workspace_id: string;

  @ManyToOne(() => WorkspaceOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'workspace_id',
    foreignKeyConstraintName: 'FK_published_sites_workspace',
  })
  workspace: WorkspaceOrmEntity;

  @Column('uuid')
  root_page_id: string;

  @ManyToOne(() => PageOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'root_page_id',
    foreignKeyConstraintName: 'FK_published_sites_root_page',
  })
  rootPage: PageOrmEntity;

  @Column({ type: 'varchar', length: 63 })
  subdomain: string;

  @Column({ name: 'allow_updates', type: 'boolean', default: false })
  allow_updates: boolean;

  @Column({ name: 'seo_title', type: 'varchar', length: 70, nullable: true })
  seo_title: string | null;

  @Column({
    name: 'seo_description',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  seo_description: string | null;

  @Column({ name: 'search_indexing', type: 'boolean', default: false })
  search_indexing: boolean;

  @Column('uuid')
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'created_by',
    foreignKeyConstraintName: 'FK_published_sites_created_by',
  })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @Column({ name: 'disabled_at', type: 'timestamptz', nullable: true })
  disabled_at: Date | null;

  @Column({
    name: 'moderation_disabled_at',
    type: 'timestamptz',
    nullable: true,
  })
  moderation_disabled_at: Date | null;

  @Column({ name: 'moderation_disabled_by', type: 'uuid', nullable: true })
  moderation_disabled_by: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'moderation_disabled_by',
    foreignKeyConstraintName: 'FK_published_sites_moderation_disabled_by',
  })
  moderationDisabledBy: User | null;

  @Column({
    name: 'moderation_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  moderation_reason: string | null;
}
