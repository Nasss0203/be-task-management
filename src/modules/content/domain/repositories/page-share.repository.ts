import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageShare } from '../entities/page-share.entity';

export interface PageShareUserDetails {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export interface PageShareDetails {
  id: string;
  userId: string;
  accessLevel: ReturnType<PageShare['getAccessLevel']>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  user: PageShareUserDetails;
}

export interface PageShareCandidate {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export interface PageShareRepository {
  save(pageShare: PageShare, context?: PersistenceContext): Promise<PageShare>;

  findById(id: string, context?: PersistenceContext): Promise<PageShare | null>;

  findByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageShare | null>;

  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShare[]>;

  findDetailsByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShareDetails[]>;

  findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageShare[]>;

  deleteByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void>;

  exists(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<boolean>;

  searchCandidates(
    pageId: string,
    currentUserId: string,
    pageCreatorId: string,
    keyword: string,
    limit?: number,
    context?: PersistenceContext,
  ): Promise<PageShareUserDetails[]>;
}
