import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PageFavoriteRepository } from 'src/modules/content/domain/repositories/page-favorite.repository';

import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { PageResponseDto } from '../../../dto/page/response/page.response.dto';

import { ListPageFavoritesQuery } from './list-page-favorites.query';

@Injectable()
export class ListPageFavoritesHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageFavoriteRepository)
    private readonly pageFavoriteRepo: PageFavoriteRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
  ) {}

  async execute(query: ListPageFavoritesQuery): Promise<PageResponseDto[]> {
    /**
     * 1. Lấy favorites của User.
     */
    const favorites = await this.pageFavoriteRepo.findByUserId(query.userId);

    /**
     * 2. Resolve các Page tương ứng.
     */
    const pages = await Promise.all(
      favorites.map((favorite) => this.pageRepo.findById(favorite.getPageId())),
    );

    /**
     * 3. Loại Page không còn tồn tại / đã bị delete.
     *
     * findById hiện tại của project đang lấy active Page.
     */
    const activePages = pages
      .filter((page): page is NonNullable<typeof page> => page !== null)
      .filter((page) => {
        if (!query.workspaceId) {
          return true;
        }

        return page.getWorkspaceId() === query.workspaceId;
      });

    /**
     * 4. Chỉ giữ Page user còn xem được trong sidebar
     * (bỏ Page của Teamspace đã archive hoặc user đã rời).
     */
    const workspaceIds = [
      ...new Set(activePages.map((page) => page.getWorkspaceId())),
    ];
    const accessible = await Promise.all(
      workspaceIds.map((workspaceId) =>
        this.pageRepo.findAccessibleByWorkspace(workspaceId, query.userId),
      ),
    );
    const accessibleIds = new Set(
      accessible.flat().map((page) => page.getId()),
    );

    return activePages
      .filter((page) => accessibleIds.has(page.getId()))
      .map((page) => PageResponseDto.fromDomain(page));
  }
}
