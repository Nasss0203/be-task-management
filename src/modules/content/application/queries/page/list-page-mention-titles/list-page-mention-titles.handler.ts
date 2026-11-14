import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { ListPageMentionTitlesQuery } from './list-page-mention-titles.query';

export const MENTION_TITLES_LIMIT = 50;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PageMentionTitleDto {
  pageId: string;
  title: string;
  icon: string | null;
}

export type PageMentionTitlesDto = Record<string, PageMentionTitleDto | null>;

@Injectable()
export class ListPageMentionTitlesHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: ListPageMentionTitlesQuery,
  ): Promise<PageMentionTitlesDto> {
    const ids = [
      ...new Set(
        query.pageIds
          .map((id) => id.trim().toLowerCase())
          .filter((id) => UUID.test(id)),
      ),
    ];

    if (ids.length > MENTION_TITLES_LIMIT) {
      throw new BadRequestException(
        `At most ${MENTION_TITLES_LIMIT} page ids are allowed`,
      );
    }

    const entries = await Promise.all(
      ids.map(async (id) => [id, await this.readable(id, query)] as const),
    );

    return Object.fromEntries(entries);
  }

  private async readable(
    pageId: string,
    query: ListPageMentionTitlesQuery,
  ): Promise<PageMentionTitleDto | null> {
    const page = await this.pageRepo.findById(pageId);

    if (
      !page ||
      page.getDeletedAt() ||
      page.getWorkspaceId() !== query.workspaceId
    ) {
      return null;
    }

    const canRead = await this.authorizationService.authorize({
      userId: query.userId,
      permissions: [PERMISSIONS.PAGE_READ],
      target: { type: 'page', id: pageId },
    });

    return canRead
      ? { pageId, title: page.getTitle(), icon: page.getIcon() }
      : null;
  }
}
