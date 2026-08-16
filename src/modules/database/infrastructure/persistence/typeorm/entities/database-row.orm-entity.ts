import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { DatabaseOrmEntity } from './database.orm-entity';
import { RowValueOrmEntity } from './row-value.orm-entity';

@Entity('database_rows')
export class DatabaseRowOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'database_id',
    type: 'uuid',
  })
  databaseId: string;

  @ManyToOne(() => DatabaseOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'database_id',
  })
  database: DatabaseOrmEntity;

  @OneToMany(() => RowValueOrmEntity, (value) => value.row, {
    cascade: true,
  })
  values: RowValueOrmEntity[];
}
