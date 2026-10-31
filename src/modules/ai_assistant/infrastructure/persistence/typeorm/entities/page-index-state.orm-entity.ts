import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';

/**
 * M5: when a Page's vectors were last made, and with which model. A Page
 * edited after `indexed_at` (pages / page_blocks `updated_at`, which have no
 * zone) is indexed again, so the time has no zone either.
 */
@Entity('page_index_state')
export class PageIndexStateOrmEntity {
  @PrimaryColumn({
    name: 'page_id',
    type: 'uuid',
    primaryKeyConstraintName: 'PK_page_index_state',
  })
  pageId: string;

  @OneToOne(() => PageOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'page_id',
    foreignKeyConstraintName: 'FK_page_index_state_page',
  })
  page?: PageOrmEntity;

  @Column({ name: 'indexed_at', type: 'timestamp' })
  indexedAt: Date;

  @Column({ type: 'varchar', length: 100 })
  model: string;
}
