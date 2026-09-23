import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageAccessRequestRepository } from 'src/modules/content/domain/repositories/page-access-request.repository';

import { GetMyPageAccessRequestQuery } from './get-my-page-access-request.query';

export interface GetMyPageAccessRequestResult {
  id: string;
  pageId: string;
  userId: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class GetMyPageAccessRequestHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageAccessRequestRepository)
    private readonly pageAccessRequestRepository: PageAccessRequestRepository,
  ) {}

  async execute(
    query: GetMyPageAccessRequestQuery,
  ): Promise<GetMyPageAccessRequestResult | null> {
    const request =
      await this.pageAccessRequestRepository.findPendingByPageAndUser(
        query.pageId,
        query.userId,
      );

    if (!request) {
      return null;
    }

    return {
      id: request.getId(),
      pageId: request.getPageId(),
      userId: request.getUserId(),
      status: request.getStatus(),
      createdAt: request.getCreatedAt(),
    };
  }
}
