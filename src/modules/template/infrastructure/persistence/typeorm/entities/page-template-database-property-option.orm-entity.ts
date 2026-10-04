import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PageTemplateDatabasePropertyOrmEntity } from './page-template-database-property.orm-entity';

@Entity('page_template_database_property_options')
@Index('IDX_page_template_database_property_options_template_prop_id', [
  'templatePropertyId',
])
export class PageTemplateDatabasePropertyOptionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_property_id', type: 'uuid' })
  templatePropertyId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 255 })
  position: string;

  @ManyToOne(
    () => PageTemplateDatabasePropertyOrmEntity,
    (property) => property.options,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'template_property_id' })
  property: PageTemplateDatabasePropertyOrmEntity;
}
