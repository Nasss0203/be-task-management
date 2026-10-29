import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { DatabaseOrmEntity } from './database.orm-entity';
import { RowValueOrmEntity } from './row-value.orm-entity';

@Entity('database_rows')
@Index('IDX_DATABASE_ROWS_DATABASE_PARENT', ['databaseId', 'parentRowId'])
export class DatabaseRowOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'database_id',
    type: 'uuid',
  })
  databaseId: string;

  @Column({
    name: 'parent_row_id',
    type: 'uuid',
    nullable: true,
  })
  parentRowId: string | null;

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

  @ManyToOne(() => DatabaseRowOrmEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'parent_row_id',
  })
  parentRow?: DatabaseRowOrmEntity | null;

  @OneToMany(() => RowValueOrmEntity, (value) => value.row, {
    cascade: true,
  })
  values: RowValueOrmEntity[];
}
