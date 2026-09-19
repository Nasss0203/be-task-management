import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PageAccessRequestStatus } from '../../../../domain/constants/page-access-request-status.constant';

@Entity('page_access_requests')
@Index('IDX_page_access_requests_page_id', ['page_id'])
@Index('IDX_page_access_requests_user_id', ['user_id'])
@Index('IDX_page_access_requests_status', ['status'])
export class PageAccessRequestOrmEntity {
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

  @Column({
    type: 'enum',
    enum: PageAccessRequestStatus,
    enumName: 'page_access_request_status_enum',
  })
  status: PageAccessRequestStatus;

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
