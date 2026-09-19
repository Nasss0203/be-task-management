import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { PageShareStatus } from '../../../../domain/constants/page-share-status.constant';
import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

@Entity('page_shares')
@Unique('UQ_page_shares_page_user', ['page_id', 'user_id'])
@Index('IDX_page_shares_page_id', ['page_id'])
@Index('IDX_page_shares_user_id', ['user_id'])
@Index('IDX_page_shares_share_link_id', ['share_link_id'])
@Index('IDX_page_shares_created_by', ['created_by'])
@Index('IDX_page_shares_status', ['status'])
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
   * Legacy reference.
   *
   * Với flow hiện tại:
   * - Anyone with the link không tạo PageShare.
   * - Direct invitation sử dụng PageShare.
   *
   * Giữ nullable để tương thích dữ liệu cũ.
   */
  @Column({
    type: 'uuid',
    nullable: true,
  })
  share_link_id: string | null;

  /**
   * Quyền mà owner đã chọn cho user.
   *
   * Quyền này chỉ có hiệu lực khi:
   * status = ACCEPTED.
   */
  @Column({
    type: 'enum',
    enum: ResourceAccessLevel,
    enumName: 'resource_access_level_enum',
  })
  access_level: ResourceAccessLevel;

  /**
   * Trạng thái invitation:
   *
   * PENDING:
   * - Owner đã invite.
   * - User chưa accept/reject.
   *
   * ACCEPTED:
   * - User đã accept.
   * - PageShare bắt đầu cấp quyền.
   *
   * REJECTED:
   * - User đã reject.
   * - PageShare không cấp quyền.
   */
  @Column({
    type: 'enum',
    enum: PageShareStatus,
    enumName: 'page_share_status_enum',
    default: PageShareStatus.PENDING,
  })
  status: PageShareStatus;

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
