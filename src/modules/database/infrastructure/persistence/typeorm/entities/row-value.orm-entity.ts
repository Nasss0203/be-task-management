import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { type RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import { DatabasePropertyOrmEntity } from './database-property.orm-entity';
import { DatabaseRowOrmEntity } from './database-row.orm-entity';

@Entity('database_row_values')
export class RowValueOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'row_id',
    type: 'uuid',
  })
  rowId: string;

  @Column({
    name: 'property_id',
    type: 'uuid',
  })
  propertyId: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  value: RowValueData;

  @ManyToOne(() => DatabaseRowOrmEntity, (row) => row.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'row_id',
  })
  row: DatabaseRowOrmEntity;

  @ManyToOne(() => DatabasePropertyOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'property_id',
  })
  property: DatabasePropertyOrmEntity;
}
