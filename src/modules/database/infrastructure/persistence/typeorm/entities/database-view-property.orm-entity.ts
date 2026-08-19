import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

import { DatabasePropertyOrmEntity } from './database-property.orm-entity';
import { DatabaseViewOrmEntity } from './database-view.orm-entity';

@Entity('database_view_properties')
@Unique('UQ_database_view_property_view_property', ['viewId', 'propertyId'])
export class DatabaseViewPropertyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'view_id',
    type: 'uuid',
  })
  viewId: string;

  @Column({
    name: 'property_id',
    type: 'uuid',
  })
  propertyId: string;

  @Column({
    type: 'varchar',
  })
  position: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  visible: boolean;

  @Column({
    type: 'integer',
    nullable: true,
  })
  width: number | null;

  @ManyToOne(() => DatabaseViewOrmEntity, (view) => view.properties, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'view_id',
  })
  view: DatabaseViewOrmEntity;

  @ManyToOne(() => DatabasePropertyOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'property_id',
  })
  property: DatabasePropertyOrmEntity;
}
