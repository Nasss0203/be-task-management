import { Inject, Injectable } from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { CONTENT_TYPES } from '../../../../content.types';
import type { PageSearchReader } from '../../../ports/page-search-reader.port';
import {
  buildSnippet,
  normalizeSearchText,
} from '../../../services/search-text';
import { SearchPagesQuery } from './search-pages.query';

export const SEARCH_RESULT_LIMIT = 20;
const SEARCH_CANDIDATE_LIMIT = 40;

export interface PageSearchResultDto {
  pageId: string;
  title: string;
  icon: string | null;
  teamspaceId: string | null;
  parentPageId: string | null;
  updatedAt: Date;
  matchedIn: 'title' | 'content' | null;
  snippet: string | null;
}

@Injectable()
export class SearchPagesHandler {
  constructor(
    @Inject(CONTENT_TYPES.ports.PageSearchReader)
    private readonly pageSearchReader: PageSearchReader,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: SearchPagesQuery): Promise<PageSearchResultDto[]> {
    const normalizedQuery = normalizeSearchText(query.query).slice(0, 100);

    const candidates = await this.pageSearchReader.search({
      workspaceId: query.workspaceId,
      userId: query.userId,
      normalizedQuery,
      limit: SEARCH_CANDIDATE_LIMIT,
    });

    const allowed = await Promise.all(
      candidates.map((candidate) =>
        this.authorizationService.authorize({
          userId: query.userId,
          permissions: [PERMISSIONS.PAGE_READ],
          target: { type: 'page', id: candidate.pageId },
        }),
      ),
    );

    return candidates
      .filter((_, index) => allowed[index])
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((candidate) => ({
        pageId: candidate.pageId,
        title: candidate.title,
        icon: candidate.icon,
        teamspaceId: candidate.teamspaceId,
        parentPageId: candidate.parentPageId,
        updatedAt: candidate.updatedAt,
        matchedIn: !normalizedQuery
          ? null
          : candidate.matchedInTitle
            ? 'title'
            : 'content',
        snippet:
          normalizedQuery && candidate.snippet
            ? buildSnippet(candidate.snippet, normalizedQuery)
            : null,
      }));
  }
}
