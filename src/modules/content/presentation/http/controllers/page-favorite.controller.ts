import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AddPageFavoriteCommand } from 'src/modules/content/application/commands/page-favorite/add-page-favorite/add-page-favorite.command';
import { AddPageFavoriteHandler } from 'src/modules/content/application/commands/page-favorite/add-page-favorite/add-page-favorite.handler';
import { RemovePageFavoriteCommand } from 'src/modules/content/application/commands/page-favorite/remove-page-favorite/remove-page-favorite.command';
import { RemovePageFavoriteHandler } from 'src/modules/content/application/commands/page-favorite/remove-page-favorite/remove-page-favorite.handler';
import { ListPageFavoritesHandler } from 'src/modules/content/application/queries/page-favorite/list-page-favorites/list-page-favorites.handler';
import { ListPageFavoritesQuery } from 'src/modules/content/application/queries/page-favorite/list-page-favorites/list-page-favorites.query';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { type IAuth } from 'src/types/auth';

@Controller('page')
export class PageFavoriteController {
  constructor(
    @Inject(CONTENT_TYPES.applications.AddPageFavoriteHandler)
    private readonly addPageFavoriteHandler: AddPageFavoriteHandler,

    @Inject(CONTENT_TYPES.applications.RemovePageFavoriteHandler)
    private readonly removePageFavoriteHandler: RemovePageFavoriteHandler,

    @Inject(CONTENT_TYPES.applications.ListPageFavoritesHandler)
    private readonly listPageFavoritesHandler: ListPageFavoritesHandler,
  ) {}

  /**
   * Add Page Favorite
   */
  @Post(':pageId/favorite')
  async addFavorite(@Param('pageId') pageId: string, @Auth() userId: IAuth) {
    await this.addPageFavoriteHandler.execute(
      new AddPageFavoriteCommand(userId.id, pageId),
    );

    return {
      success: true,
    };
  }

  /**
   * Remove Page Favorite
   */
  @Delete(':pageId/favorite')
  async removeFavorite(@Param('pageId') pageId: string, @Auth() userId: IAuth) {
    await this.removePageFavoriteHandler.execute(
      new RemovePageFavoriteCommand(userId.id, pageId),
    );

    return {
      success: true,
    };
  }

  @Get('favorites')
  async listFavorites(
    @Auth() userId: IAuth,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.listPageFavoritesHandler.execute(
      new ListPageFavoritesQuery(userId.id, workspaceId),
    );
  }
}
