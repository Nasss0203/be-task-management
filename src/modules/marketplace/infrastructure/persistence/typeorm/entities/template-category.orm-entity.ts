import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { TemplateListingCategoryOrmEntity } from './template-listing-category.orm-entity';

@Entity('template_categories')
@Unique('UQ_template_categories_slug', ['slug'])
@Index('IDX_template_categories_is_active_sort_order', [
  'isActive',
  'sortOrder',
  'name',
])
export class TemplateCategoryOrmEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_template_categories',
  })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @OneToMany(
    () => TemplateListingCategoryOrmEntity,
    (listingCategory) => listingCategory.category,
  )
  listingCategories: TemplateListingCategoryOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
