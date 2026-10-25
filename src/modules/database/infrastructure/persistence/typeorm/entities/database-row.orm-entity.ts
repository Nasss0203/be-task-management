import {
  Column,
  CreateDateColumn,
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

  @Column({
    type: 'double precision',
    default: 0,
  })
  position: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

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
