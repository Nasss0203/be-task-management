import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PageTemplateDatabaseRowValueOrmEntity } from './page-template-database-row-value.orm-entity';
import { PageTemplateDatabaseOrmEntity } from './page-template-database.orm-entity';

@Entity('page_template_database_rows')
@Index('IDX_page_template_database_rows_template_database_id', [
  'templateDatabaseId',
])
export class PageTemplateDatabaseRowOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_database_id', type: 'uuid' })
  templateDatabaseId: string;

  @ManyToOne(() => PageTemplateDatabaseOrmEntity, (database) => database.rows, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_database_id' })
  database: PageTemplateDatabaseOrmEntity;

  @OneToMany(
    () => PageTemplateDatabaseRowValueOrmEntity,
    (rowValue) => rowValue.row,
  )
  values: PageTemplateDatabaseRowValueOrmEntity[];
}
