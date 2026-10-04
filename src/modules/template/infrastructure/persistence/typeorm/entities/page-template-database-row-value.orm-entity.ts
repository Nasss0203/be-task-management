import { type RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PageTemplateDatabasePropertyOrmEntity } from './page-template-database-property.orm-entity';
import { PageTemplateDatabaseRowOrmEntity } from './page-template-database-row.orm-entity';

@Entity('page_template_database_row_values')
@Index('IDX_page_template_database_row_values_template_row_id', [
  'templateRowId',
])
@Index('IDX_page_template_database_row_values_template_property_id', [
  'templatePropertyId',
])
export class PageTemplateDatabaseRowValueOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_row_id', type: 'uuid' })
  templateRowId: string;

  @Column({ name: 'template_property_id', type: 'uuid' })
  templatePropertyId: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  value: RowValueData;

  @ManyToOne(() => PageTemplateDatabaseRowOrmEntity, (row) => row.values, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_row_id' })
  row: PageTemplateDatabaseRowOrmEntity;

  @ManyToOne(() => PageTemplateDatabasePropertyOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_property_id' })
  property: PageTemplateDatabasePropertyOrmEntity;
}
