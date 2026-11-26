import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import { RecordPageVisitCommand } from 'src/modules/content/application/commands/page-visit/record-page-visit/record-page-visit.command';
import { RecordPageVisitHandler } from 'src/modules/content/application/commands/page-visit/record-page-visit/record-page-visit.handler';
import { ListRecentPageVisitsHandler } from 'src/modules/content/application/queries/page-visit/list-recent-page-visits/list-recent-page-visits.handler';
import { ListRecentPageVisitsQuery } from 'src/modules/content/application/queries/page-visit/list-recent-page-visits/list-recent-page-visits.query';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { type IAuth } from 'src/types/auth';

@Controller('page')
export class PageVisitController {
  constructor(
    @Inject(CONTENT_TYPES.applications.RecordPageVisitHandler)
    private readonly recordPageVisitHandler: RecordPageVisitHandler,

    @Inject(CONTENT_TYPES.applications.ListRecentPageVisitsHandler)
    private readonly listRecentPageVisitsHandler: ListRecentPageVisitsHandler,
  ) {}

  @Post(':pageId/visit')
  async recordVisit(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Auth() auth: IAuth,
  ) {
    await this.recordPageVisitHandler.execute(
      new RecordPageVisitCommand(auth.id, pageId),
    );

    return { success: true };
  }

  @Get('visits/recent')
  listRecent(
    @Auth() auth: IAuth,
    @Query('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.listRecentPageVisitsHandler.execute(
      new ListRecentPageVisitsQuery(auth.id, workspaceId, limit),
    );
  }
}
