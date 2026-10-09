import { User } from 'src/modules/identity/identity.types';
import {
  Column,
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
import { PageTemplateOrmEntity } from './page-template.orm-entity';

@Entity('template_listings')
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
  @JoinColumn({ name: 'template_id' })
  template: PageTemplateOrmEntity;

  @Column({
    name: 'offer_type',
    type: 'enum',
    enum: TemplateOfferType,
    enumName: 'template_listings_offer_type_enum',
    default: TemplateOfferType.FREE,
  })
  offerType: TemplateOfferType;

  @Column({
    type: 'enum',
    enum: TemplateListingStatus,
    enumName: 'template_listings_status_enum',
    default: TemplateListingStatus.DRAFT,
  })
  status: TemplateListingStatus;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
