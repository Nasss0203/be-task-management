import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';
import { User } from 'src/modules/identity/identity.types';
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
import { PageTemplateVersionOrmEntity } from './page-template-version.orm-entity';

@Entity('page_template_blocks')
@Index('IDX_page_template_blocks_version_id', ['versionId'])
@Index('IDX_page_template_blocks_version_id_order_index', [
  'versionId',
  'orderIndex',
])
@Index('IDX_page_template_blocks_parent_block_id', ['parentBlockId'])
export class PageTemplateBlockOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'version_id', type: 'uuid' })
  versionId: string;

  @ManyToOne(() => PageTemplateVersionOrmEntity, (version) => version.blocks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'version_id' })
  version: PageTemplateVersionOrmEntity;

  @Column({ name: 'parent_block_id', type: 'uuid', nullable: true })
  parentBlockId: string | null;

  @ManyToOne(() => PageTemplateBlockOrmEntity, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'parent_block_id' })
  parentBlock: PageTemplateBlockOrmEntity | null;

  @Column({
    type: 'enum',
    enum: PageBlockType,
    enumName: 'page_template_blocks_type_enum',
  })
  type: PageBlockType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ name: 'position_x', type: 'int', nullable: true })
  positionX: number | null;

  @Column({ name: 'position_y', type: 'int', nullable: true })
  positionY: number | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @Column({ type: 'jsonb', nullable: true })
  content: PageBlockJson;

  @Column({ name: 'style_config', type: 'jsonb', nullable: true })
  styleConfig: PageBlockStyleConfig;

  @Column({ name: 'data_config', type: 'jsonb', nullable: true })
  dataConfig: PageBlockJson;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'is_open', type: 'boolean', default: true })
  isOpen: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
