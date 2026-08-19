import { PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockJson, PageBlockStyleConfig } from 'src/modules/content/domain/entities/page-block.entity';
import { PageOrmEntity } from './page.orm-entity';
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

@Entity('page_blocks')
@Index('IDX_PAGE_BLOCKS_PAGE_ID', ['page_id'])
@Index('IDX_PAGE_BLOCKS_DELETED_AT', ['deleted_at'])
@Index('UQ_PAGE_BLOCKS_PAGE_ORDER_ACTIVE', ['page_id', 'order_index'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class PageBlockOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  page_id: string;

  @ManyToOne(() => PageOrmEntity, (page) => page.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: PageOrmEntity;

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
