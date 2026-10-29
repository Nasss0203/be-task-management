import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PageBlockOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';

/**
 * M5 (kế hoạch hạ tầng vector): one vector for a Page's title and headers
 * (PAGE) or for a piece of one block's text (BLOCK). The text itself is not
 * kept here; it is read again from the block when needed.
 */
@Entity('page_embeddings')
@Index('IDX_page_embeddings_page_id', ['pageId'])
@Index('IDX_page_embeddings_workspace_model', ['workspaceId', 'model'])
export class PageEmbeddingOrmEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_page_embeddings',
  })
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'page_id', type: 'uuid' })
  pageId: string;

  @ManyToOne(() => PageOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'page_id',
    foreignKeyConstraintName: 'FK_page_embeddings_page',
  })
  page?: PageOrmEntity;

  @Column({ name: 'block_id', type: 'uuid', nullable: true })
  blockId: string | null;

  @ManyToOne(() => PageBlockOrmEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'block_id',
    foreignKeyConstraintName: 'FK_page_embeddings_block',
  })
  block?: PageBlockOrmEntity | null;

  @Column({ name: 'resource_type', type: 'varchar', length: 16 })
  resourceType: 'PAGE' | 'BLOCK';

  @Column({ name: 'chunk_index', type: 'int', default: 0 })
  chunkIndex: number;

  @Column({ name: 'content_hash', type: 'char', length: 64 })
  contentHash: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'int' })
  dimensions: number;

  @Column({ type: 'real', array: true })
  embedding: number[];

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
