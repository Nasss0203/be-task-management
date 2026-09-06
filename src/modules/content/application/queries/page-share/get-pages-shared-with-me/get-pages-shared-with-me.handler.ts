import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

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

    const results = await Promise.all(
      shares.map(async (share) => {
        const page = await this.pageRepository.findById(share.getPageId());

        if (!page) {
          return null;
        }

        return {
          id: page.getId(),

          workspace_id: page.getWorkspaceId(),

          teamspace_id: page.getTeamspaceId(),

          parent_page_id: page.getParentPageId(),

          title: page.getTitle(),

          slug: page.getSlug(),

          icon: page.getIcon(),

          cover_url: page.getCoverUrl(),

          accessLevel: share.getAccessLevel(),
        } satisfies SharedPageDto;
      }),
    );

    return results.filter((result): result is SharedPageDto => result !== null);
  }
}
