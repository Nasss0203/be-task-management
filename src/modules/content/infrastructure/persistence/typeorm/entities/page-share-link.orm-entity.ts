import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

@Entity('page_share_links')
@Index('UQ_page_share_links_token_hash', ['token_hash'], {
  unique: true,
})
@Index('IDX_page_share_links_page_id', ['page_id'])
@Index('IDX_page_share_links_created_by', ['created_by'])
export class PageShareLinkOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  page_id: string;

  /**
   * Không lưu raw token.
   * Chỉ lưu SHA-256 hash của token.
   */
  @Column({
    type: 'varchar',
    length: 64,
  })
  token_hash: string;

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

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  expires_at: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  revoked_at: Date | null;

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
