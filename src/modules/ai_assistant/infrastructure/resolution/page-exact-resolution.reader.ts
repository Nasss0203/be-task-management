import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { PageResolutionReader } from '../../application/resolution/page-resolution.port';

@Injectable()
export class PageExactResolutionReader implements PageResolutionReader {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,
  ) {}

  async findAccessibleByExactTitle(
    userId: string,
    workspaceId: string,
    title: string,
  ): Promise<Page[]> {
    // Reuse Content's workspace/teamspace-scoped reader; never search all pages.
    // A later optimization can push the exact-title predicate into this query.
    const pages = await this.pageRepository.findAccessibleByWorkspace(
      workspaceId,
      userId,
    );
    const normalizedTitle = this.normalizeTitle(title);

    return pages.filter(
      (page) =>
        page.getDeletedAt() === null &&
        page.getWorkspaceId() === workspaceId &&
        this.normalizeTitle(page.getTitle()) === normalizedTitle,
    );
  }

  private normalizeTitle(title: string): string {
    return title.normalize('NFC').trim().toLocaleLowerCase('vi');
  }
}
