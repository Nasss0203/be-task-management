import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { TemplateVersionAssetProvider } from '../../../../domain/enums/template-version-asset-provider.enum';
import { TemplateVersionAssetStatus } from '../../../../domain/enums/template-version-asset-status.enum';
import { TemplateVersionAssetType } from '../../../../domain/enums/template-version-asset-type.enum';
import { PageTemplateVersionOrmEntity } from './page-template-version.orm-entity';

@Entity('template_version_assets')
@Unique('UQ_template_version_assets_version_id_asset_type', [
  'templateVersionId',
  'assetType',
])
@Index('IDX_template_version_assets_template_version_id', ['templateVersionId'])
export class TemplateVersionAssetOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_version_id', type: 'uuid' })
  templateVersionId: string;

  @ManyToOne(() => PageTemplateVersionOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_version_id' })
  templateVersion: PageTemplateVersionOrmEntity;

  @Column({
    name: 'asset_type',
    type: 'enum',
    enum: TemplateVersionAssetType,
    enumName: 'template_version_assets_asset_type_enum',
  })
  assetType: TemplateVersionAssetType;

  @Column({
    type: 'enum',
    enum: TemplateVersionAssetProvider,
    enumName: 'template_version_assets_provider_enum',
  })
  provider: TemplateVersionAssetProvider;

  @Column({ name: 'storage_key', type: 'text' })
  storageKey: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 150, nullable: true })
  mimeType: string | null;

  @Column({
    name: 'file_size',
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  fileSize: number | null;

  @Column({ name: 'width', type: 'int', nullable: true })
  width: number | null;

  @Column({ name: 'height', type: 'int', nullable: true })
  height: number | null;

  @Column({
    type: 'enum',
    enum: TemplateVersionAssetStatus,
    enumName: 'template_version_assets_status_enum',
    default: TemplateVersionAssetStatus.PENDING,
  })
  status: TemplateVersionAssetStatus;

  @Column({ name: 'generated_at', type: 'timestamptz', nullable: true })
  generatedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
