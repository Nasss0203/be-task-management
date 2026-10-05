import { User } from 'src/modules/identity/identity.types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { TemplateVersionStatus } from '../../../../domain/enums/template-version-status.enum';
import { PageTemplateBlockOrmEntity } from './page-template-block.orm-entity';
import { PageTemplateDatabaseOrmEntity } from './page-template-database.orm-entity';
import { PageTemplateOrmEntity } from './page-template.orm-entity';

@Entity('page_template_versions')
@Unique('UQ_page_template_versions_template_id_version_number', [
  'templateId',
  'versionNumber',
])
@Index('IDX_page_template_versions_template_id', ['templateId'])
@Index('IDX_page_template_versions_template_id_status', [
  'templateId',
  'status',
])
export class PageTemplateVersionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ManyToOne(() => PageTemplateOrmEntity, (template) => template.versions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_id' })
  template: PageTemplateOrmEntity;

  @Column({ name: 'version_number', type: 'int' })
  versionNumber: number;

  @Column({
    type: 'enum',
    enum: TemplateVersionStatus,
    enumName: 'page_template_versions_status_enum',
    default: TemplateVersionStatus.DRAFT,
  })
  status: TemplateVersionStatus;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({
    name: 'snapshot_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  snapshotHash: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @OneToMany(() => PageTemplateBlockOrmEntity, (block) => block.version)
  blocks: PageTemplateBlockOrmEntity[];

  @OneToMany(
    () => PageTemplateDatabaseOrmEntity,
    (database) => database.version,
  )
  databases: PageTemplateDatabaseOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
