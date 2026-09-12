import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import type { PageShareWithUserDto } from '../../../dto/page-share/page-share-with-user.dto';

import { GetPageSharesQuery } from './get-page-shares.query';

@Injectable()
export class GetPageSharesHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: GetPageSharesQuery): Promise<PageShareWithUserDto[]> {
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
        'You do not have permission to view page shares',
      );
    }

    return this.pageShareRepository.findDetailsByPageId(query.pageId);
  }
}
