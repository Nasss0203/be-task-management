import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { DatabasePropertyOrmEntity } from './database-property.orm-entity';

@Entity('database_property_options')
export class PropertyOptionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'property_id',
    type: 'uuid',
  })
  propertyId: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  color: string | null;

  @Column({
    type: 'varchar',
    length: 255,
  })
  position: string;

  @ManyToOne(() => DatabasePropertyOrmEntity, (property) => property.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'property_id',
  })
  property: DatabasePropertyOrmEntity;
}
