import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';
import type { SharedPageDto } from '../../../dto/page-share/shared-page.dto';

import { GetPagesSharedWithMeQuery } from './get-pages-shared-with-me.query';

@Injectable()
export class GetPagesSharedWithMeHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,
  ) {}

  async execute(query: GetPagesSharedWithMeQuery): Promise<SharedPageDto[]> {
    const shares = await this.pageShareRepository.findByUserId(query.userId);

    if (shares.length === 0) {
      return [];
    }

    const groups = await Promise.all(
      shares.map(async (share) => {
        const rootPage = await this.pageRepository.findById(share.getPageId());

        if (!rootPage) {
          return [];
        }

        const descendants = await this.pageRepository.findDescendants(
          rootPage.getId(),
        );

        const pages = [rootPage, ...descendants];

        return pages.map(
          (page): SharedPageDto => ({
            id: page.getId(),

            workspace_id: page.getWorkspaceId(),

            teamspace_id: page.getTeamspaceId(),

            parent_page_id: page.getParentPageId(),

            title: page.getTitle(),

            slug: page.getSlug(),

            icon: page.getIcon(),

            cover_url: page.getCoverUrl(),

            accessLevel: share.getAccessLevel(),
          }),
        );
      }),
    );

    const pageMap = new Map<string, SharedPageDto>();

    for (const group of groups) {
      for (const page of group) {
        const existing = pageMap.get(page.id);

        if (!existing) {
          pageMap.set(page.id, page);
          continue;
        }

        if (
          existing.accessLevel === ResourceAccessLevel.VIEWER &&
          page.accessLevel === ResourceAccessLevel.EDITOR
        ) {
          pageMap.set(page.id, page);
        }
      }
    }

    return Array.from(pageMap.values());
  }
}
