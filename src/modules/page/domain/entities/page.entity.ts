import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pages')
@Index('IDX_PAGES_WORKSPACE_ID', ['workspace_id'])
@Index('UQ_PAGES_WORKSPACE_SLUG', ['workspace_id', 'slug'], { unique: true })
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, nullable: true, type: 'varchar' })
  slug: string | null;

  @Column({ default: false })
  is_template: boolean;

  @Column('uuid', { name: 'created_by' })
  created_by: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => PageBlock, (block) => block.page)
  blocks: PageBlock[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
