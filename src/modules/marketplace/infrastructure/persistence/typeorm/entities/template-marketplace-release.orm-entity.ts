import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { PageTemplateOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { PageTemplateVersionOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template-version.orm-entity';

@Entity('template_marketplace_releases')
@Unique('UQ_template_marketplace_releases_template_version', [
  'templateId',
  'versionId',
])
@Index('IDX_template_marketplace_releases_template_released_at', [
  'templateId',
  'releasedAt',
])
@Check(
  'CHK_template_marketplace_releases_offer_type',
  `"offer_type_at_release" IN ('FREE', 'PAID')`,
)
export class TemplateMarketplaceReleaseOrmEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_template_marketplace_releases',
  })
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ManyToOne(() => PageTemplateOrmEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'template_id',
    foreignKeyConstraintName: 'FK_template_marketplace_releases_template',
  })
  template: PageTemplateOrmEntity;

  @Column({ name: 'version_id', type: 'uuid' })
  versionId: string;

  @ManyToOne(() => PageTemplateVersionOrmEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn([
    {
      name: 'version_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName:
        'FK_template_marketplace_releases_version_template',
    },
    {
      name: 'template_id',
      referencedColumnName: 'templateId',
      foreignKeyConstraintName:
        'FK_template_marketplace_releases_version_template',
    },
  ])
  version: PageTemplateVersionOrmEntity;

  @Column({ name: 'released_at', type: 'timestamptz' })
  releasedAt: Date;

  @Column({ name: 'released_by', type: 'uuid', nullable: true })
  releasedBy: string | null;

  @Column({ name: 'offer_type_at_release', type: 'varchar' })
  offerTypeAtRelease: string;
}
