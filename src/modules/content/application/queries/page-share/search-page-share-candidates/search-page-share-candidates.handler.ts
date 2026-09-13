import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import type { PageShareUserDto } from '../../../dto/page-share/page-share-with-user.dto';

import { SearchPageShareCandidatesQuery } from './search-page-share-candidates.query';

@Injectable()
export class SearchPageShareCandidatesHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: SearchPageShareCandidatesQuery,
  ): Promise<PageShareUserDto[]> {
    const keyword = query.keyword.trim();

    if (keyword.length < 2) {
      return [];
    }

    const allowed = await this.authorizationService.authorize({
      userId: query.userId,
      permissions: [PERMISSIONS.PAGE_SHARE_READ],
      target: {
        type: 'page',
        id: query.pageId,
      },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to search page share candidates',
      );
    }

    const page = await this.pageRepository.findById(query.pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const pageCreatorId = page.getCreatedBy();

    console.log({
      currentUserId: query.userId,
      pageCreatorId,
    });

    const candidates = await this.pageShareRepository.searchCandidates(
      query.pageId,
      query.userId,
      pageCreatorId,
      keyword,
      10,
    );

    console.log(
      candidates.map((candidate) => ({
        id: candidate.id,
        username: candidate.username,
        email: candidate.email,
      })),
    );

    return candidates.map((candidate) => ({
      id: candidate.id,
      username: candidate.username,
      displayName: candidate.displayName,
      email: candidate.email,
      avatarUrl: candidate.avatarUrl,
    }));
  }
}
