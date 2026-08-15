import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { DatabasePropertyOrmEntity } from './database-property.orm-entity';

@Entity('databases')
export class DatabaseOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'page_id',
    type: 'uuid',
  })
  pageId: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @OneToMany(() => DatabasePropertyOrmEntity, (property) => property.database, {
    cascade: true,
  })
  properties: DatabasePropertyOrmEntity[];
}
