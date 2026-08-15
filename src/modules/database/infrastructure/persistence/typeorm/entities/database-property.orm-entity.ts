import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { PropertyType } from '../../../../domain/enums/property-type.enum';
import { DatabaseOrmEntity } from './database.orm-entity';
import { PropertyOptionOrmEntity } from './property-option.orm-entity';

@Entity('database_properties')
export class DatabasePropertyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'database_id',
    type: 'uuid',
  })
  databaseId: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
    enumName: 'database_property_type_enum',
  })
  type: PropertyType;

  @Column({
    type: 'varchar',
    length: 255,
  })
  position: string;

  @ManyToOne(() => DatabaseOrmEntity, (database) => database.properties, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'database_id',
  })
  database: DatabaseOrmEntity;

  @OneToMany(() => PropertyOptionOrmEntity, (option) => option.property, {
    cascade: true,
  })
  options: PropertyOptionOrmEntity[];
}
