import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from '../../../../content.types';
import type { PageEditRequestRepository } from '../../../../domain/repositories/page-edit-request.repository';

import { PageEditRequestDto } from '../../../dto/page-edit-request/page-edit-request.dto';
import { GetMyPageEditRequestsQuery } from './get-my-page-edit-requests.query';

@Injectable()
export class GetMyPageEditRequestsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageEditRequestRepository)
    private readonly pageEditRequestRepository: PageEditRequestRepository,
  ) {}

  async execute(
    query: GetMyPageEditRequestsQuery,
  ): Promise<PageEditRequestDto[]> {
    const requests = await this.pageEditRequestRepository.findByUserId(
      query.userId,
    );

    return requests.map((request) => PageEditRequestDto.fromDomain(request));
  }
}
