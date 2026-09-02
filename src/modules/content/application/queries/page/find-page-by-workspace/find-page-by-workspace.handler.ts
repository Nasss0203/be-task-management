import { Inject, Injectable } from '@nestjs/common';
import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { FindPageByWorkspaceQuery } from './find-page-by-workspace.query';

@Injectable()
export class FindPageByWorkspaceHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
  ) {}

  async execute(query: FindPageByWorkspaceQuery): Promise<PageResponseDto[]> {
    const pages = await this.pageRepo.findAccessibleByWorkspace(
      query.workspaceId,
      query.userId,
    );
    return pages.map((page) => PageResponseDto.fromDomain(page));
  }
}
