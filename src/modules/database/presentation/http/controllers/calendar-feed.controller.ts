import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Put,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import {
  PublicReadRateLimit,
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { SkipTransform } from 'src/common/decorator/skip.transform';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { IAuth } from 'src/types/auth';

import { RevokeCalendarFeedCommand } from 'src/modules/database/application/commands/revoke-calendar-feed/revoke-calendar-feed.command';
import { RevokeCalendarFeedHandler } from 'src/modules/database/application/commands/revoke-calendar-feed/revoke-calendar-feed.handler';
import { UpsertCalendarFeedCommand } from 'src/modules/database/application/commands/upsert-calendar-feed/upsert-calendar-feed.command';
import { UpsertCalendarFeedHandler } from 'src/modules/database/application/commands/upsert-calendar-feed/upsert-calendar-feed.handler';
import { GetCalendarFeedIcsHandler } from 'src/modules/database/application/queries/get-calendar-feed-ics/get-calendar-feed-ics.handler';
import { GetCalendarFeedIcsQuery } from 'src/modules/database/application/queries/get-calendar-feed-ics/get-calendar-feed-ics.query';
import { GetMyCalendarFeedHandler } from 'src/modules/database/application/queries/get-my-calendar-feed/get-my-calendar-feed.handler';
import { GetMyCalendarFeedQuery } from 'src/modules/database/application/queries/get-my-calendar-feed/get-my-calendar-feed.query';
import { UpsertCalendarFeedRequest } from '../requests/upsert-calendar-feed.request';

@Controller()
export class CalendarFeedController {
  constructor(
    private readonly getMyCalendarFeedHandler: GetMyCalendarFeedHandler,
    private readonly upsertCalendarFeedHandler: UpsertCalendarFeedHandler,
    private readonly revokeCalendarFeedHandler: RevokeCalendarFeedHandler,
    private readonly getCalendarFeedIcsHandler: GetCalendarFeedIcsHandler,
  ) {}

  @Get('databases/:databaseId/calendar-feed')
  @ReadRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  getMyCalendarFeed(
    @Param('databaseId') databaseId: string,
    @Auth() auth: IAuth,
  ) {
    return this.getMyCalendarFeedHandler.execute(
      new GetMyCalendarFeedQuery(databaseId, auth.id),
    );
  }

  @Put('databases/:databaseId/calendar-feed')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  upsertCalendarFeed(
    @Param('databaseId') databaseId: string,
    @Body() request: UpsertCalendarFeedRequest,
    @Auth() auth: IAuth,
  ) {
    return this.upsertCalendarFeedHandler.execute(
      new UpsertCalendarFeedCommand(
        databaseId,
        request.datePropertyId,
        auth.id,
      ),
    );
  }

  @Delete('databases/:databaseId/calendar-feed')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  revokeCalendarFeed(
    @Param('databaseId') databaseId: string,
    @Auth() auth: IAuth,
  ) {
    return this.revokeCalendarFeedHandler.execute(
      new RevokeCalendarFeedCommand(databaseId, auth.id),
    );
  }

  @Get('calendar-feeds/:file')
  @Public()
  @SkipTransform()
  @PublicReadRateLimit()
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Cache-Control', 'private, max-age=300')
  getCalendarFeedIcs(@Param('file') file: string) {
    return this.getCalendarFeedIcsHandler.execute(
      new GetCalendarFeedIcsQuery(file.replace(/\.ics$/, '')),
    );
  }
}
