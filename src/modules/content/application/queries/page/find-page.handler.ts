import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

export class FindPageByWorkspaceQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
  ) {}
}

export class FindDeletedPagesQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
  ) {}
}
export class FindPageByIdQuery {
  constructor(public readonly pageId: string) {}
}

@Injectable()
export class FindPageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
  ) {}

  async findPageByWorkspaceId(
    query: FindPageByWorkspaceQuery,
  ): Promise<PageResponseDto[]> {
    const pages = await this.pageRepo.findAccessibleByWorkspace(
      query.workspaceId,
      query.userId,
    );
    return pages.map((page) => PageResponseDto.fromDomain(page));
  }

  async findDeletedPages(
    query: FindDeletedPagesQuery,
  ): Promise<PageResponseDto[]> {
    const pages = await this.pageRepo.findAccessibleDeletedByWorkspace(
      query.workspaceId,
      query.userId,
    );

    return pages.map((page) => PageResponseDto.fromDomain(page));
  }

  async findPageById(query: FindPageByIdQuery): Promise<PageResponseDto> {
    const page = await this.pageRepo.findById(query.pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return PageResponseDto.fromDomain(page);
  }
}
