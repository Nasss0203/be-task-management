import { Page } from 'src/modules/page/domain/entities/page.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PageBlockType {
  PROJECT_LIST = 'PROJECT_LIST',
  PAGE = 'PAGE',
  BOARD = 'BOARD',
  TASK_LIST = 'TASK_LIST',
  TABLE = 'TABLE',
  CHART = 'CHART',
  STATS = 'STATS',
  TEXT = 'TEXT',
}

@Entity('page_blocks')
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

  @Column({ type: 'int', default: 4 })
  width: number;

  @Column({ type: 'int', default: 2 })
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
