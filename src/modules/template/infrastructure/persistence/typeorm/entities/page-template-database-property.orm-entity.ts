import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PageTemplateDatabaseOrmEntity } from './page-template-database.orm-entity';
import { PageTemplateDatabasePropertyOptionOrmEntity } from './page-template-database-property-option.orm-entity';

@Entity('page_template_database_properties')
@Index('IDX_page_template_database_properties_template_database_id', [
  'templateDatabaseId',
])
export class PageTemplateDatabasePropertyOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_database_id', type: 'uuid' })
  templateDatabaseId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
    enumName: 'page_template_database_properties_type_enum',
  })
  type: PropertyType;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ name: 'is_hideable', type: 'boolean', default: true })
  isHideable: boolean;

  @Column({ type: 'varchar', length: 255 })
  position: string;

  @ManyToOne(
    () => PageTemplateDatabaseOrmEntity,
    (database) => database.properties,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'template_database_id' })
  database: PageTemplateDatabaseOrmEntity;

  @OneToMany(
    () => PageTemplateDatabasePropertyOptionOrmEntity,
    (option) => option.property,
  )
  options: PageTemplateDatabasePropertyOptionOrmEntity[];
}
