import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
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
import { AcceptPageShareLinkRequestDto } from 'src/modules/content/application/dto/page-share/accept-page-share-link.request.dto';
import { CreatePageShareLinkRequestDto } from 'src/modules/content/application/dto/page-share/create-page-share-link.request.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { type IAuth } from 'src/types/auth';

@Controller('page')
export class PageShareController {
  constructor(
    @Inject(CONTENT_TYPES.applications.CreatePageShareLinkHandler)
    private readonly createPageShareLinkHandler: CreatePageShareLinkHandler,

    @Inject(CONTENT_TYPES.applications.AcceptPageShareLinkHandler)
    private readonly acceptPageShareLinkHandler: AcceptPageShareLinkHandler,
  ) {}

  @Post(':pageId/share-links')
  async createShareLink(
    @Param('pageId') pageId: string,
    @Body() body: CreatePageShareLinkRequestDto,
    @Auth() userId: IAuth,
  ): Promise<CreatePageShareLinkResult> {
    return this.createPageShareLinkHandler.execute(
      new CreatePageShareLinkCommand(
        userId.id,
        pageId,
        body.access_level,
        body.expires_at ? new Date(body.expires_at) : null,
      ),
    );
  }

  @Post('share-links/accept')
  async acceptShareLink(
    @Body() body: AcceptPageShareLinkRequestDto,
    @Auth() userId: IAuth,
  ): Promise<AcceptPageShareLinkResult> {
    return this.acceptPageShareLinkHandler.execute(
      new AcceptPageShareLinkCommand(userId.id, body.token),
    );
  }
}
