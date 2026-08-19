import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
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
@Index('IDX_PAGES_DELETED_AT', ['deletedAt'])
@Index('UQ_PAGES_WORKSPACE_SLUG_ACTIVE', ['workspace_id', 'slug'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @ManyToOne(() => WorkspaceOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceOrmEntity;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, nullable: true, type: 'varchar' })
  slug: string | null;

  @Column({ length: 255, nullable: true, type: 'varchar' })
  icon: string | null;

  @Column({ name: 'cover_url', nullable: true, type: 'text' })
  cover_url: string | null;

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

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
