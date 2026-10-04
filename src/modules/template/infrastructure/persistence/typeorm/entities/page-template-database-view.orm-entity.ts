import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PageTemplateDatabaseViewPropertyOrmEntity } from './page-template-database-view-property.orm-entity';
import { PageTemplateDatabaseOrmEntity } from './page-template-database.orm-entity';

@Entity('page_template_database_views')
@Index('IDX_page_template_database_views_template_database_id', [
  'templateDatabaseId',
])
export class PageTemplateDatabaseViewOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_database_id', type: 'uuid' })
  templateDatabaseId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: DatabaseViewType,
    enumName: 'page_template_database_views_type_enum',
  })
  type: DatabaseViewType;

  @Column({
    type: 'varchar',
    length: 255,
  })
  position: string;

  @ManyToOne(
    () => PageTemplateDatabaseOrmEntity,
    (database) => database.views,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'template_database_id' })
  database: PageTemplateDatabaseOrmEntity;

  @OneToMany(
    () => PageTemplateDatabaseViewPropertyOrmEntity,
    (viewProperty) => viewProperty.view,
  )
  properties: PageTemplateDatabaseViewPropertyOrmEntity[];
}
