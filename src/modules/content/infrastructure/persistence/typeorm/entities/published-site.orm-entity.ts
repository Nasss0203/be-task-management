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
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceOrmEntity;

  @Column('uuid')
  root_page_id: string;

  @ManyToOne(() => PageOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'root_page_id' })
  rootPage: PageOrmEntity;

  @Column({ type: 'varchar', length: 63 })
  subdomain: string;

  @Column({ name: 'allow_updates', type: 'boolean', default: false })
  allow_updates: boolean;

  @Column('uuid')
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @Column({ name: 'disabled_at', type: 'timestamptz', nullable: true })
  disabled_at: Date | null;
}
