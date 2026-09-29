import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from '../../../../content.types';
import type { PublishedSiteRepository } from '../../../../domain/repositories/published-site.repository';
import { PublishedSiteResponseDto } from '../../../dto/page-publication/response/published-site.response.dto';
import { ListWorkspacePublishedSitesQuery } from './list-workspace-published-sites.query';

@Injectable()
export class ListWorkspacePublishedSitesHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
  ) {}

  async execute(
    query: ListWorkspacePublishedSitesQuery,
  ): Promise<PublishedSiteResponseDto[]> {
    return (await this.sites.findByWorkspaceId(query.workspaceId))
      .filter((site) => site.getDisabledAt() === null)
      .sort(
        (a, b) =>
          b.getCreatedAt().getTime() - a.getCreatedAt().getTime() ||
          a.getId().localeCompare(b.getId()),
      )
      .map((site) => PublishedSiteResponseDto.fromDomain(site));
  }
}
