import {
  Check,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { TemplateListingOrmEntity } from './template-listing.orm-entity';

/** Creator free-form tags of a listing, stored normalized (lowercase slug). */
@Entity('template_listing_tags')
@Index('IDX_template_listing_tags_tag', ['tag'])
@Check(
  'CHK_template_listing_tags_tag',
  `"tag" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("tag") BETWEEN 2 AND 32`,
)
export class TemplateListingTagOrmEntity {
  @PrimaryColumn({ name: 'listing_id', type: 'uuid' })
  listingId: string;

  @PrimaryColumn({ name: 'tag', type: 'varchar', length: 32 })
  tag: string;

  @ManyToOne(() => TemplateListingOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'listing_id',
    foreignKeyConstraintName: 'FK_template_listing_tags_listing',
  })
  listing: TemplateListingOrmEntity;
}
