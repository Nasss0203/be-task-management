import { User } from 'src/modules/identity/identity.types';
import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { TemplateListingStatus } from '../../../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { PageTemplateVersionOrmEntity } from './page-template-version.orm-entity';
import { PageTemplateOrmEntity } from './page-template.orm-entity';

@Entity('template_listings')
@Check(
  'CHK_template_listings_pricing',
  `"currency" = 'VND' AND "price_amount" BETWEEN 0 AND 9007199254740991 AND (("offer_type" = 'FREE' AND "price_amount" = 0) OR ("offer_type" = 'PAID' AND "price_amount" > 0))`,
)
@Unique('UQ_template_listings_template_id', ['templateId'])
@Index('IDX_template_listings_template_id', ['templateId'])
@Index('IDX_template_listings_created_by', ['createdBy'])
@Index('IDX_template_listings_status', ['status'])
export class TemplateListingOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @OneToOne(() => PageTemplateOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'template_id',
    foreignKeyConstraintName: 'FK_template_listings_template',
  })
  template: PageTemplateOrmEntity;

  @Column({
    name: 'offer_type',
    type: 'enum',
    enum: TemplateOfferType,
    default: TemplateOfferType.FREE,
  })
  offerType: TemplateOfferType;

  // ============================
  // TEMPLATE PRICING
  // ============================

  @Column({
    name: 'price_amount',
    type: 'bigint',
    default: '0',
  })
  priceAmount: string;

  @Column({
    name: 'currency',
    type: 'varchar',
    length: 3,
    default: 'VND',
  })
  currency: string;

  // ============================
  // LISTING STATUS
  // ============================

  @Column({
    type: 'enum',
    enum: TemplateListingStatus,
    default: TemplateListingStatus.DRAFT,
  })
  status: TemplateListingStatus;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'created_by',
    foreignKeyConstraintName: 'FK_template_listings_created_by',
  })
  creator: User;

  // ============================
  // PUBLISHED VERSION
  // ============================

  @Column({
    name: 'published_version_id',
    type: 'uuid',
    nullable: true,
  })
  publishedVersionId: string | null;

  @ManyToOne(() => PageTemplateVersionOrmEntity, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn([
    {
      name: 'published_version_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_listing_published_version_template',
    },
    {
      name: 'template_id',
      referencedColumnName: 'templateId',
      foreignKeyConstraintName: 'FK_listing_published_version_template',
    },
  ])
  publishedVersion: PageTemplateVersionOrmEntity | null;

  @Column({
    name: 'published_at',
    type: 'timestamptz',
    nullable: true,
  })
  publishedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
