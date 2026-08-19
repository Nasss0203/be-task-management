import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('page_template_blocks')
@Index(['templateId'])
@Index(['templateId', 'orderIndex'])
@Index(['parentBlockId'])
export class PageTemplateBlockOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @Column({ name: 'parent_block_id', type: 'uuid', nullable: true })
  parentBlockId: string | null;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, unknown> | null;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
