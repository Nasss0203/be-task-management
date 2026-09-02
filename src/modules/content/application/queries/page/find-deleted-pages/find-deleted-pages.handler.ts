import { Inject, Injectable } from '@nestjs/common';
import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { FindDeletedPagesQuery } from './find-deleted-pages.query';

@Injectable()
export class FindDeletedPagesHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
  ) {}

  async execute(query: FindDeletedPagesQuery): Promise<PageResponseDto[]> {
    const pages = await this.pageRepo.findAccessibleDeletedByWorkspace(
      query.workspaceId,
      query.userId,
    );

    return pages.map((page) => PageResponseDto.fromDomain(page));
  }
}
