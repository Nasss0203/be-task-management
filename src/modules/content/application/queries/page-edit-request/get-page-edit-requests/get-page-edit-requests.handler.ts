import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from '../../../../content.types';
import { PageEditRequestStatus } from '../../../../domain/constants/page-edit-request-status.constant';
import type { PageEditRequestRepository } from '../../../../domain/repositories/page-edit-request.repository';

import { GetPageEditRequestsQuery } from './get-page-edit-requests.query';

// sửa import theo đúng source hiện tại của bạn
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PageEditRequestDto } from '../../../dto/page-edit-request/page-edit-request.dto';

@Injectable()
export class GetPageEditRequestsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageEditRequestRepository)
    private readonly pageEditRequestRepository: PageEditRequestRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: GetPageEditRequestsQuery,
  ): Promise<PageEditRequestDto[]> {
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
        'You do not have permission to view edit requests',
      );
    }

    const requests = await this.pageEditRequestRepository.findByPageId(
      query.pageId,
    );

    return requests
      .filter(
        (request) => request.getStatus() === PageEditRequestStatus.PENDING,
      )
      .map((request) => PageEditRequestDto.fromDomain(request));
  }
}
