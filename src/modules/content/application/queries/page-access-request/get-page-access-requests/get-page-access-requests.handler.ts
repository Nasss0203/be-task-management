import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

import type { PageAccessRequestRepository } from '../../../../domain/repositories/page-access-request.repository';

import { GetPageAccessRequestsQuery } from './get-page-access-requests.query';

export interface GetPageAccessRequestItem {
  id: string;
  pageId: string;
  userId: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class GetPageAccessRequestsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageAccessRequestRepository)
    private readonly pageAccessRequestRepository: PageAccessRequestRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: GetPageAccessRequestsQuery,
  ): Promise<GetPageAccessRequestItem[]> {
    /**
     * Reviewer phải có quyền xem sharing của Page.
     */
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
        'You do not have permission to view page access requests',
      );
    }

    /**
     * Chỉ lấy các request đang chờ xử lý.
     */
    const requests =
      await this.pageAccessRequestRepository.findPendingDetailsByPageId(
        query.pageId,
      );

    return requests;
  }
}
