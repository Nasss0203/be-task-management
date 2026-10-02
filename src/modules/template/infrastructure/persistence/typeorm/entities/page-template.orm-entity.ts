import { User } from 'src/modules/identity/identity.types';
import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import { PageTemplateVersionOrmEntity } from './page-template-version.orm-entity';

@Entity('page_templates')
@Index('IDX_page_templates_source_page_id', ['sourcePageId'])
@Index('IDX_page_templates_workspace_id', ['workspaceId'])
@Index('IDX_page_templates_created_by', ['createdBy'])
@Index('IDX_page_templates_status_visibility', ['status', 'visibility'])
export class PageTemplateOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_page_id', type: 'uuid', nullable: true })
  sourcePageId: string | null;

  @ManyToOne(() => PageOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_page_id' })
  sourcePage: PageOrmEntity | null;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => WorkspaceOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceOrmEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string | null;

  @Column({ name: 'cover_url', type: 'text', nullable: true })
  coverUrl: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    enumName: 'page_templates_status_enum',
    default: TemplateStatus.DRAFT,
  })
  status: TemplateStatus;

  @Column({
    type: 'enum',
    enum: TemplateVisibility,
    enumName: 'page_templates_visibility_enum',
    default: TemplateVisibility.PRIVATE,
  })
  visibility: TemplateVisibility;

  @OneToMany(() => PageTemplateVersionOrmEntity, (version) => version.template)
  versions: PageTemplateVersionOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
