import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PageTemplateDatabasePropertyOrmEntity } from './page-template-database-property.orm-entity';
import { PageTemplateDatabaseViewOrmEntity } from './page-template-database-view.orm-entity';

@Entity('page_template_database_view_properties')
@Unique('UQ_page_template_database_view_properties_view_property', [
  'templateViewId',
  'templatePropertyId',
])
@Index('IDX_page_template_database_view_properties_template_view_id', [
  'templateViewId',
])
@Index('IDX_page_template_database_view_properties_template_prop_id', [
  'templatePropertyId',
])
export class PageTemplateDatabaseViewPropertyOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_view_id', type: 'uuid' })
  templateViewId: string;

  @Column({ name: 'template_property_id', type: 'uuid' })
  templatePropertyId: string;

  @Column({ type: 'varchar', length: 255 })
  position: string;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @Column({ type: 'integer', nullable: true })
  width: number | null;

  @ManyToOne(
    () => PageTemplateDatabaseViewOrmEntity,
    (view) => view.properties,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'template_view_id' })
  view: PageTemplateDatabaseViewOrmEntity;

  @ManyToOne(() => PageTemplateDatabasePropertyOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_property_id' })
  property: PageTemplateDatabasePropertyOrmEntity;
}
