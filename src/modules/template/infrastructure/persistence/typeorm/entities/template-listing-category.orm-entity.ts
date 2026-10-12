import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TemplateListingOrmEntity } from './template-listing.orm-entity';
import { TemplateCategoryOrmEntity } from './template-category.orm-entity';

@Entity('template_listing_categories')
@Index('IDX_template_listing_categories_category_id', ['categoryId'])
@Index('IDX_template_listing_categories_listing_id', ['listingId'])
export class TemplateListingCategoryOrmEntity {
  @PrimaryColumn({ name: 'listing_id', type: 'uuid' })
  listingId: string;

  @PrimaryColumn({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => TemplateListingOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'listing_id',
    foreignKeyConstraintName: 'FK_template_listing_categories_listing',
  })
  listing: TemplateListingOrmEntity;

  @ManyToOne(
    () => TemplateCategoryOrmEntity,
    (category) => category.listingCategories,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'category_id',
    foreignKeyConstraintName: 'FK_template_listing_categories_category',
  })
  category: TemplateCategoryOrmEntity;
}
