import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PageTemplateDatabasePropertyOrmEntity } from './page-template-database-property.orm-entity';
import { PageTemplateDatabaseRowOrmEntity } from './page-template-database-row.orm-entity';
import { PageTemplateDatabaseViewOrmEntity } from './page-template-database-view.orm-entity';
import { PageTemplateVersionOrmEntity } from './page-template-version.orm-entity';

@Entity('page_template_databases')
@Index('IDX_page_template_databases_version_id', ['versionId'])
export class PageTemplateDatabaseOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'version_id', type: 'uuid' })
  versionId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(
    () => PageTemplateVersionOrmEntity,
    (version) => version.databases,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'version_id' })
  version: PageTemplateVersionOrmEntity;

  @OneToMany(
    () => PageTemplateDatabasePropertyOrmEntity,
    (property) => property.database,
  )
  properties: PageTemplateDatabasePropertyOrmEntity[];

  @OneToMany(() => PageTemplateDatabaseRowOrmEntity, (row) => row.database)
  rows: PageTemplateDatabaseRowOrmEntity[];

  @OneToMany(() => PageTemplateDatabaseViewOrmEntity, (view) => view.database)
  views: PageTemplateDatabaseViewOrmEntity[];
}
