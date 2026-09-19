import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageAccessRequest } from '../entities/page-access-request.entity';

export interface PageAccessRequestUserDetails {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export interface PageAccessRequestDetails {
  id: string;
  pageId: string;
  userId: string;
  status: string;
  createdAt: Date;
  user: PageAccessRequestUserDetails;
}
export interface PageAccessRequestRepository {
  save(
    request: PageAccessRequest,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest | null>;

  findPendingByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest | null>;

  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest[]>;

  findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest[]>;

  findPendingByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest[]>;

  findPendingDetailsByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequestDetails[]>;
}
