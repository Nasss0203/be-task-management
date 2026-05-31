import { Page } from 'src/modules/page/domain/entities/page.entity';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
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

export enum PageBlockType {
  TEXT = 'TEXT',
  HEADER = 'HEADER',
  QUOTE = 'QUOTE',
  DIVIDER = 'DIVIDER',
  CODE = 'CODE',
  TODO = 'TODO',

  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  BOOKMARK = 'BOOKMARK',

  EMBED = 'EMBED',
  FIGMA = 'FIGMA',
  GITHUB_GIST = 'GITHUB_GIST',
  GOOGLE_MAPS = 'GOOGLE_MAPS',
  TWEET = 'TWEET',

  DATABASE_VIEW = 'DATABASE_VIEW',
  TABLE_SIMPLE = 'TABLE_SIMPLE',
  MERMAID = 'MERMAID',
  BUTTON = 'BUTTON',
}

export type PageBlockDatabaseViewDataConfig = {
  workspace_id: string;
  project_id: string;
  default_board_id: string | null;
  default_view_type: BoardViewType;
};

export type PageBlockJson =
  | Record<string, unknown>
  | unknown[]
  | PageBlockDatabaseViewDataConfig
  | null;
export type PageBlockStyleConfig = Record<string, unknown> | null;

@Entity('page_blocks')
@Index('IDX_PAGE_BLOCKS_PAGE_ID', ['page_id'])
@Index('IDX_PAGE_BLOCKS_DELETED_AT', ['deleted_at'])
@Index('UQ_PAGE_BLOCKS_PAGE_ORDER_ACTIVE', ['page_id', 'order_index'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class PageBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  page_id: string;

  @ManyToOne(() => Page, (page) => page.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

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
