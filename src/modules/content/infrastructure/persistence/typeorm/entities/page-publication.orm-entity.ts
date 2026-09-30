import { User } from 'src/modules/identity/identity.types';
import { PagePublicationType } from '../../../../domain/enums/page-publication-type.enum';
import {
  Column,
  Check,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { PageOrmEntity } from './page.orm-entity';
import { PublishedSiteOrmEntity } from './published-site.orm-entity';

@Entity('page_publications')
@Unique('UQ_page_publications_site_page', ['site_id', 'page_id'])
@Unique('UQ_page_publications_site_path', ['site_id', 'path'])
@Unique('UQ_page_publications_site_id_id', ['site_id', 'id'])
@Check(
  'CK_page_publications_shape',
  `(path = '/' AND parent_publication_id IS NULL AND publication_type = 'DIRECT') OR (path <> '/' AND parent_publication_id IS NOT NULL AND parent_publication_id <> id)`,
)
@Check(
  'CK_page_publications_inherited_options',
  `publication_type <> 'INHERITED' OR include_descendants = false`,
)
@Index('IDX_page_publications_site_id', ['site_id'])
@Index('IDX_page_publications_page_id', ['page_id'])
@Index('IDX_page_publications_unpublished_at', ['unpublished_at'])
@Index('IDX_page_publications_parent_publication_id', ['parent_publication_id'])
export class PagePublicationOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  site_id: string;

  @ManyToOne(() => PublishedSiteOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: PublishedSiteOrmEntity;

  @Column('uuid')
  page_id: string;

  @ManyToOne(() => PageOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: PageOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  parent_publication_id: string | null;

  @ManyToOne(() => PagePublicationOrmEntity, {
    nullable: true,
    onDelete: 'NO ACTION',
    deferrable: 'INITIALLY DEFERRED',
  })
  @JoinColumn([
    {
      name: 'site_id',
      referencedColumnName: 'site_id',
      foreignKeyConstraintName: 'FK_page_publications_parent',
    },
    {
      name: 'parent_publication_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_page_publications_parent',
    },
  ])
  parent: PagePublicationOrmEntity | null;

  @Column({
    type: 'enum',
    enum: PagePublicationType,
    enumName: 'page_publication_type',
    default: PagePublicationType.DIRECT,
  })
  publication_type: PagePublicationType;

  @Column({ type: 'boolean', default: false })
  include_descendants: boolean;

  @Column({ type: 'varchar', length: 2048 })
  path: string;

  @Column('uuid')
  published_by: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'published_by' })
  publisher: User;

  @Column({ name: 'published_at', type: 'timestamptz' })
  published_at: Date;

  @Column({ name: 'unpublished_at', type: 'timestamptz', nullable: true })
  unpublished_at: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
