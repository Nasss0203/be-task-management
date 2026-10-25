import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import type { DatabaseViewSort } from '../../../../domain/aggregates/view/database-view.aggregate';
import type { DatabaseViewFilter } from '../../../../domain/constants/database-view-filter.constant';
import { DatabaseViewType } from '../../../../domain/enums/database-view-type.enum';
import { DatabaseViewPropertyOrmEntity } from './database-view-property.orm-entity';
import { DatabaseOrmEntity } from './database.orm-entity';

@Entity('database_views')
export class DatabaseViewOrmEntity {
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
    enum: DatabaseViewType,
    enumName: 'database_view_type_enum',
  })
  type: DatabaseViewType;

  @Column({
    type: 'varchar',
    length: 255,
  })
  position: string;

  @Column({
    type: 'jsonb',
    default: () => "'[]'",
  })
  sorts: DatabaseViewSort[];

  @Column({
    type: 'jsonb',
    default: () => "'[]'",
  })
  filters: DatabaseViewFilter[];

  @Column({
    name: 'group_by',
    type: 'uuid',
    nullable: true,
  })
  groupBy: string | null;

  @ManyToOne(() => DatabaseOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'database_id',
  })
  database: DatabaseOrmEntity;

  @OneToMany(
    () => DatabaseViewPropertyOrmEntity,
    (viewProperty) => viewProperty.view,
    {
      cascade: true,
    },
  )
  properties: DatabaseViewPropertyOrmEntity[];
}
