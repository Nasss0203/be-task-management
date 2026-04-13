import { Page } from 'src/modules/page/domain/entities/page.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PageBlockType {
  PROJECT = 'PROJECT',
  BOARD = 'BOARD',
  TABLE = 'TABLE',
  CHART = 'CHART',
  STATS = 'STATS',
  TEXT = 'TEXT',
  HEADER = 'HEADER',
}

@Entity('page_blocks')
@Index('IDX_PAGE_BLOCKS_PAGE_ID', ['page_id'])
@Index('UQ_PAGE_BLOCKS_PAGE_ORDER', ['page_id', 'order_index'], {
  unique: true,
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

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'int', default: 0 })
  position_x: number;

  @Column({ type: 'int', default: 0 })
  position_y: number;

  @Column({ type: 'int', default: 12 })
  width: number;

  @Column({ type: 'int', default: 1 })
  height: number;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @Column({ type: 'jsonb', nullable: true })
  style_config: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  data_config: Record<string, any> | null;

  @Column('uuid', { name: 'created_by' })
  created_by: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
