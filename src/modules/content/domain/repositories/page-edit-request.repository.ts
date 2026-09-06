import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageEditRequest } from '../entities/page-edit-request.entity';

export interface PageEditRequestRepository {
  save(
    request: PageEditRequest,
    context?: PersistenceContext,
  ): Promise<PageEditRequest>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageEditRequest | null>;

  /**
   * Dùng để tránh một user gửi nhiều request PENDING
   * cho cùng một PageShare.
   */
  findPendingByPageShareId(
    pageShareId: string,
    context?: PersistenceContext,
  ): Promise<PageEditRequest | null>;

  /**
   * Owner xem các request của một Page.
   */
  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageEditRequest[]>;

  /**
   * User xem các request mình đã gửi.
   */
  findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageEditRequest[]>;
}
