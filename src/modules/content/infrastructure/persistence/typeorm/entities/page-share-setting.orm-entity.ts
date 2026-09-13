import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

import { PageOrmEntity } from './page.orm-entity';

@Entity('page_share_settings')
export class PageShareSettingOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    unique: true,
  })
  page_id: string;

  @OneToOne(() => PageOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'page_id',
  })
  page: PageOrmEntity;

  @Column({
    type: 'enum',
    enum: ResourceAccessLevel,
    enumName: 'resource_access_level_enum',
    nullable: true,
  })
  workspace_access_level: ResourceAccessLevel | null;

  @Column({
    type: 'enum',
    enum: ResourceAccessLevel,
    enumName: 'resource_access_level_enum',
    nullable: true,
  })
  link_access_level: ResourceAccessLevel | null;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
