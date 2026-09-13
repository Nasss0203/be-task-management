import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';

import { AcceptPageShareLinkCommand } from 'src/modules/content/application/commands/page-share/accept-page-share-link/accept-page-share-link.command';

import {
  AcceptPageShareLinkHandler,
  AcceptPageShareLinkResult,
} from 'src/modules/content/application/commands/page-share/accept-page-share-link/accept-page-share-link.handler';

import { CreatePageShareLinkCommand } from 'src/modules/content/application/commands/page-share/create-page-share-link/create-page-share-link.command';

import {
  CreatePageShareLinkHandler,
  CreatePageShareLinkResult,
} from 'src/modules/content/application/commands/page-share/create-page-share-link/create-page-share-link.handler';

import { SharePageCommand } from 'src/modules/content/application/commands/page-share/share-page/share-page.command';

import { SharePageHandler } from 'src/modules/content/application/commands/page-share/share-page/share-page.handler';

import { UpdatePageShareCommand } from 'src/modules/content/application/commands/page-share/update-page-share/update-page-share.command';

import { UpdatePageShareHandler } from 'src/modules/content/application/commands/page-share/update-page-share/update-page-share.handler';
import { PageShareUserDto } from 'src/modules/content/application/dto/page-share/page-share-with-user.dto';

import { PageShareDto } from 'src/modules/content/application/dto/page-share/page-share.dto';

import { AcceptPageShareLinkRequestDto } from 'src/modules/content/application/dto/page-share/request/accept-page-share-link.request.dto';

import { CreatePageShareLinkRequestDto } from 'src/modules/content/application/dto/page-share/request/create-page-share-link.request.dto';

import { SharePageRequestDto } from 'src/modules/content/application/dto/page-share/request/share-page.request.dto';

import { UpdatePageShareRequestDto } from 'src/modules/content/application/dto/page-share/request/update-page-share.request.dto';

import { SharedPageDto } from 'src/modules/content/application/dto/page-share/shared-page.dto';

import { GetPageSharesHandler } from 'src/modules/content/application/queries/page-share/get-page-shares/get-page-shares.handler';

import { GetPageSharesQuery } from 'src/modules/content/application/queries/page-share/get-page-shares/get-page-shares.query';

import { GetPagesSharedWithMeHandler } from 'src/modules/content/application/queries/page-share/get-pages-shared-with-me/get-pages-shared-with-me.handler';

import { GetPagesSharedWithMeQuery } from 'src/modules/content/application/queries/page-share/get-pages-shared-with-me/get-pages-shared-with-me.query';
import { SearchPageShareCandidatesHandler } from 'src/modules/content/application/queries/page-share/search-page-share-candidates/search-page-share-candidates.handler';
import { SearchPageShareCandidatesQuery } from 'src/modules/content/application/queries/page-share/search-page-share-candidates/search-page-share-candidates.query';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { type IAuth } from 'src/types/auth';

@Controller()
export class PageShareController {
  constructor(
    @Inject(CONTENT_TYPES.applications.CreatePageShareLinkHandler)
    private readonly createPageShareLinkHandler: CreatePageShareLinkHandler,

    @Inject(CONTENT_TYPES.applications.AcceptPageShareLinkHandler)
    private readonly acceptPageShareLinkHandler: AcceptPageShareLinkHandler,

    @Inject(CONTENT_TYPES.applications.SharePageHandler)
    private readonly sharePageHandler: SharePageHandler,

    @Inject(CONTENT_TYPES.applications.GetPagesSharedWithMeHandler)
    private readonly getPagesSharedWithMeHandler: GetPagesSharedWithMeHandler,

    @Inject(CONTENT_TYPES.applications.GetPageSharesHandler)
    private readonly getPageSharesHandler: GetPageSharesHandler,

    @Inject(CONTENT_TYPES.applications.UpdatePageShareHandler)
    private readonly updatePageShareHandler: UpdatePageShareHandler,

    @Inject(CONTENT_TYPES.applications.SearchPageShareCandidatesHandler)
    private readonly searchPageShareCandidatesHandler: SearchPageShareCandidatesHandler,
  ) {}

  /**
   * Direct share Page cho một user.
   *
   * POST /api/v1/page-shares/page/:pageId
   *
   * Body:
   * {
   *   "user_id": "...",
   *   "access_level": "EDITOR"
   * }
   */

  @Post('page-shares/page/:pageId')
  async sharePage(
    @Param('pageId')
    pageId: string,

    @Body()
    body: SharePageRequestDto,

    @Auth()
    user: IAuth,
  ): Promise<PageShareDto> {
    return this.sharePageHandler.execute(
      new SharePageCommand(user.id, pageId, body.user_id, body.access_level),
    );
  }

  /**
   * Tạo share link.
   */
  @Post('page/:pageId/share-links')
  async createShareLink(
    @Param('pageId')
    pageId: string,

    @Body()
    body: CreatePageShareLinkRequestDto,

    @Auth()
    user: IAuth,
  ): Promise<CreatePageShareLinkResult> {
    return this.createPageShareLinkHandler.execute(
      new CreatePageShareLinkCommand(
        user.id,
        pageId,
        body.expires_at ? new Date(body.expires_at) : null,
      ),
    );
  }

  /**
   * Accept share link.
   */
  @Post('page/share-links/accept')
  async acceptShareLink(
    @Body()
    body: AcceptPageShareLinkRequestDto,

    @Auth()
    user: IAuth,
  ): Promise<AcceptPageShareLinkResult> {
    return this.acceptPageShareLinkHandler.execute(
      new AcceptPageShareLinkCommand(user.id, body.token),
    );
  }

  /**
   * Các Page được share cho current user.
   */
  @Get('page-shares/shared-with-me')
  async getSharedWithMe(
    @Auth()
    user: IAuth,
  ): Promise<SharedPageDto[]> {
    return this.getPagesSharedWithMeHandler.execute(
      new GetPagesSharedWithMeQuery(user.id),
    );
  }

  /**
   * People with access.
   */
  @Get('page-shares/page/:pageId')
  async getPageShares(
    @Param('pageId')
    pageId: string,

    @Auth()
    user: IAuth,
  ): Promise<PageShareDto[]> {
    return this.getPageSharesHandler.execute(
      new GetPageSharesQuery(user.id, pageId),
    );
  }

  /**
   * Update direct PageShare access.
   */
  @Patch('page-shares/:shareId')
  async updatePageShare(
    @Param('shareId')
    shareId: string,

    @Body()
    body: UpdatePageShareRequestDto,

    @Auth()
    user: IAuth,
  ): Promise<PageShareDto> {
    return this.updatePageShareHandler.execute(
      new UpdatePageShareCommand(user.id, shareId, body.access_level),
    );
  }

  @Get('page-shares/page/:pageId/candidates')
  async searchPageShareCandidates(
    @Param('pageId')
    pageId: string,

    @Query('query')
    keyword: string,

    @Auth()
    user: IAuth,
  ): Promise<PageShareUserDto[]> {
    return this.searchPageShareCandidatesHandler.execute(
      new SearchPageShareCandidatesQuery(user.id, pageId, keyword ?? ''),
    );
  }
}
