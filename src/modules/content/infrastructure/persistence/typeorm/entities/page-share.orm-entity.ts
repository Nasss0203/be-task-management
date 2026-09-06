import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

@Entity('page_shares')
@Unique('UQ_page_shares_page_user', ['page_id', 'user_id'])
@Index('IDX_page_shares_page_id', ['page_id'])
@Index('IDX_page_shares_user_id', ['user_id'])
@Index('IDX_page_shares_share_link_id', ['share_link_id'])
@Index('IDX_page_shares_created_by', ['created_by'])
export class PageShareOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  page_id: string;

  @Column({
    type: 'uuid',
  })
  user_id: string;

  /**
   * Share link đã tạo ra PageShare này.
   *
   * Nullable để:
   * - tương thích dữ liệu cũ
   * - sau này có thể hỗ trợ direct share
   */
  @Column({
    type: 'uuid',
    nullable: true,
  })
  share_link_id: string | null;

  /**
   * Quyền thực tế của user trên Page.
   *
   * VIEWER:
   * - default khi accept link
   *
   * EDITOR:
   * - chỉ sau khi owner approve edit request
   */
  @Column({
    type: 'enum',
    enum: ResourceAccessLevel,
    enumName: 'resource_access_level_enum',
  })
  access_level: ResourceAccessLevel;

  @Column({
    type: 'uuid',
  })
  created_by: string;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updated_at: Date;
}
