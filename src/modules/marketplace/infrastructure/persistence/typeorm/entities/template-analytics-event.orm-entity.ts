import { User } from 'src/modules/identity/identity.types';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { TemplateAnalyticsEventType } from '../../../../domain/enums/template-analytics-event-type.enum';
import { PageTemplateOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { PageTemplateVersionOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template-version.orm-entity';

/**
 * Append-only VIEW/USE history. Purchases, claims and revenue are read from
 * template_purchases / template_entitlements, never duplicated here.
 */
@Entity('template_analytics_events')
// source_id is non-null only for USE (see CHECK), so this is the USE idempotency key.
@Unique('UQ_template_analytics_events_source', ['sourceId'])
@Index('IDX_template_analytics_events_template_type_created_at', [
  'templateId',
  'eventType',
  'createdAt',
])
@Index('IDX_template_analytics_events_version_id', ['versionId'])
@Check(
  'CHK_template_analytics_events_event_type',
  `"event_type" IN ('VIEW', 'USE')`,
)
@Check(
  'CHK_template_analytics_events_use_source',
  `("event_type" = 'USE' AND "source_id" IS NOT NULL AND "version_id" IS NOT NULL) OR ("event_type" <> 'USE' AND "source_id" IS NULL)`,
)
export class TemplateAnalyticsEventOrmEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_template_analytics_events',
  })
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  // RESTRICT: analytics history must not disappear with a template.
  @ManyToOne(() => PageTemplateOrmEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'template_id',
    foreignKeyConstraintName: 'FK_template_analytics_events_template',
  })
  template: PageTemplateOrmEntity;

  @Column({ name: 'version_id', type: 'uuid', nullable: true })
  versionId: string | null;

  // Composite FK keeps version_id inside the same template; NULL skips the check.
  @ManyToOne(() => PageTemplateVersionOrmEntity, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn([
    {
      name: 'version_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_template_analytics_events_version_template',
    },
    {
      name: 'template_id',
      referencedColumnName: 'templateId',
      foreignKeyConstraintName: 'FK_template_analytics_events_version_template',
    },
  ])
  version: PageTemplateVersionOrmEntity | null;

  @Column({ name: 'event_type', type: 'varchar', length: 16 })
  eventType: TemplateAnalyticsEventType;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_template_analytics_events_user',
  })
  user: User | null;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
