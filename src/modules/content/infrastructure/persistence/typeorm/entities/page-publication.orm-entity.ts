import { User } from 'src/modules/identity/identity.types';
import {
  Column,
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
@Index('IDX_page_publications_site_id', ['site_id'])
@Index('IDX_page_publications_page_id', ['page_id'])
@Index('IDX_page_publications_unpublished_at', ['unpublished_at'])
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
