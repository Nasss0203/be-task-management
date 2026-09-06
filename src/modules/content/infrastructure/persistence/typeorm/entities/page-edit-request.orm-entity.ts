import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PageEditRequestStatus } from '../../../../domain/constants/page-edit-request-status.constant';

@Entity('page_edit_requests')
@Index('IDX_page_edit_requests_page_id', ['page_id'])
@Index('IDX_page_edit_requests_page_share_id', ['page_share_id'])
@Index('IDX_page_edit_requests_user_id', ['user_id'])
@Index('IDX_page_edit_requests_status', ['status'])
export class PageEditRequestOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  page_id: string;

  /**
   * PageShare hiện tại của user.
   * Khi gửi request thì PageShare này phải là VIEWER.
   */
  @Column({
    type: 'uuid',
  })
  page_share_id: string;

  /**
   * User gửi yêu cầu edit.
   */
  @Column({
    type: 'uuid',
  })
  user_id: string;

  @Column({
    type: 'enum',
    enum: PageEditRequestStatus,
    enumName: 'page_edit_request_status_enum',
  })
  status: PageEditRequestStatus;

  /**
   * Owner / người có quyền đã xử lý request.
   */
  @Column({
    type: 'uuid',
    nullable: true,
  })
  reviewed_by: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  reviewed_at: Date | null;

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
