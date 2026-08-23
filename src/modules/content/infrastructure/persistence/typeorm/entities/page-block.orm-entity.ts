import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/modules/content/domain/entities/page-block.entity';
import { PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PageOrmEntity } from './page.orm-entity';

@Entity('page_blocks')
@Index('IDX_PAGE_BLOCKS_PAGE_ID', ['page_id'])
@Index('IDX_PAGE_BLOCKS_DELETED_AT', ['deleted_at'])
@Index('IDX_PAGE_BLOCKS_PARENT_BLOCK_ID', ['parent_block_id'])
@Index('UQ_PAGE_BLOCKS_ROOT_ORDER_ACTIVE', ['page_id', 'order_index'], {
  unique: true,
  where: '"parent_block_id" IS NULL AND "deleted_at" IS NULL',
})
@Index(
  'UQ_PAGE_BLOCKS_CHILD_ORDER_ACTIVE',
  ['page_id', 'parent_block_id', 'order_index'],
  {
    unique: true,
    where: '"parent_block_id" IS NOT NULL AND "deleted_at" IS NULL',
  },
)
export class PageBlockOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  page_id: string;

  @ManyToOne(() => PageOrmEntity, (page) => page.blocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'page_id' })
  page: PageOrmEntity;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  parent_block_id: string | null;

  @ManyToOne(() => PageBlockOrmEntity, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'parent_block_id' })
  parentBlock?: PageBlockOrmEntity | null;

  @Column({
    type: 'enum',
    enum: PageBlockType,
  })
  type: PageBlockType;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @Column({ type: 'int', nullable: true })
  position_x: number | null;

  @Column({ type: 'int', nullable: true })
  position_y: number | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'jsonb', nullable: true })
  content: PageBlockJson;

  @Column({ type: 'jsonb', nullable: true })
  data_config: PageBlockJson;

  @Column({ type: 'jsonb', nullable: true })
  style_config: PageBlockStyleConfig;

  @Column('uuid', { name: 'created_by' })
  created_by: string;

  @Column({ type: 'boolean', default: true })
  is_open: boolean;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deleted_by: string | null;
}
