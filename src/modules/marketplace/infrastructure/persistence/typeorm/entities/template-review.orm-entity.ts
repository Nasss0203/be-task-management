import { User } from 'src/modules/identity/identity.types';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

import { PageTemplateOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { PageTemplateVersionOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template-version.orm-entity';

@Entity('template_reviews')
@Unique('UQ_template_reviews_template_user', ['templateId', 'userId'])
@Index('IDX_template_reviews_template_updated_at', ['templateId', 'updatedAt'])
@Check('CHK_template_reviews_rating', '"rating" >= 1 AND "rating" <= 5')
@Check(
  'CHK_template_reviews_body_length',
  '"body" IS NULL OR char_length("body") <= 2000',
)
export class TemplateReviewOrmEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    primaryKeyConstraintName: 'PK_template_reviews',
  })
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ManyToOne(() => PageTemplateOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'template_id',
    foreignKeyConstraintName: 'FK_template_reviews_template',
  })
  template: PageTemplateOrmEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_template_reviews_user',
  })
  user: User;

  @Column({ name: 'version_id', type: 'uuid' })
  versionId: string;

  @ManyToOne(() => PageTemplateVersionOrmEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'version_id',
    foreignKeyConstraintName: 'FK_template_reviews_version',
  })
  version: PageTemplateVersionOrmEntity;

  @Column({ name: 'rating', type: 'smallint' })
  rating: number;

  @Column({ name: 'body', type: 'text', nullable: true })
  body: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
