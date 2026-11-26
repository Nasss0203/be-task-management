import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { PageResponseDto } from '../../../dto/page/response/page.response.dto';

import { ListRecentPageVisitsQuery } from './list-recent-page-visits.query';

export const DEFAULT_RECENT_PAGE_VISITS = 8;
export const MAX_RECENT_PAGE_VISITS = 20;

export type RecentPageVisitResponse = PageResponseDto & { visitedAt: Date };

function resolveLimit(limit?: string): number {
  const parsed = Number.parseInt(limit ?? '', 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_RECENT_PAGE_VISITS;
  }

  return Math.min(parsed, MAX_RECENT_PAGE_VISITS);
}

@Injectable()
export class ListRecentPageVisitsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
  ) {}

  async execute(
    query: ListRecentPageVisitsQuery,
  ): Promise<RecentPageVisitResponse[]> {
    const visits = await this.pageRepo.findRecentlyVisited(
      query.workspaceId,
      query.userId,
      resolveLimit(query.limit),
    );

    return visits.map(({ page, visitedAt }) => ({
      ...PageResponseDto.fromDomain(page),
      visitedAt,
    }));
  }
}
