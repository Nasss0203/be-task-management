import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';

export class FindPageByWorkspaceQuery {
  constructor(public readonly workspaceId: string) {}
}

export class FindDeletedPagesQuery {
  constructor(public readonly workspaceId: string) {}
}

@Injectable()
export class FindPageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
  ) {}

  async findPageByWorkspaceId(query: FindPageByWorkspaceQuery): Promise<PageResponseDto[]> {
    const pages = await this.pageRepo.findByWorkspace(query.workspaceId);
    return pages.map((page) => PageResponseDto.fromDomain(page));
  }

  async findDeletedPages(query: FindDeletedPagesQuery): Promise<PageResponseDto[]> {
    const pages = await this.pageRepo.findDeletedByWorkspace(query.workspaceId);
    return pages.map((page) => PageResponseDto.fromDomain(page));
  }
}
