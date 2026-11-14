import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { resolveFrontendOrigin } from 'src/common/config/frontend-origin.config';
import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import {
  PublicReadRateLimit,
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { IAuth } from 'src/types/auth';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';

import { ConnectGoogleCalendarCommand } from '../../../application/commands/connect-google-calendar/connect-google-calendar.command';
import { ConnectGoogleCalendarHandler } from '../../../application/commands/connect-google-calendar/connect-google-calendar.handler';
import { DeleteGoogleCalendarSyncCommand } from '../../../application/commands/delete-google-calendar-sync/delete-google-calendar-sync.command';
import { DeleteGoogleCalendarSyncHandler } from '../../../application/commands/delete-google-calendar-sync/delete-google-calendar-sync.handler';
import { DisconnectGoogleCalendarCommand } from '../../../application/commands/disconnect-google-calendar/disconnect-google-calendar.command';
import { DisconnectGoogleCalendarHandler } from '../../../application/commands/disconnect-google-calendar/disconnect-google-calendar.handler';
import { RequestGoogleCalendarSyncCommand } from '../../../application/commands/request-google-calendar-sync/request-google-calendar-sync.command';
import { RequestGoogleCalendarSyncHandler } from '../../../application/commands/request-google-calendar-sync/request-google-calendar-sync.handler';
import { UpsertGoogleCalendarSyncCommand } from '../../../application/commands/upsert-google-calendar-sync/upsert-google-calendar-sync.command';
import { UpsertGoogleCalendarSyncHandler } from '../../../application/commands/upsert-google-calendar-sync/upsert-google-calendar-sync.handler';
import { GetGoogleCalendarAuthorizeUrlHandler } from '../../../application/queries/get-google-calendar-authorize-url/get-google-calendar-authorize-url.handler';
import { GetGoogleCalendarAuthorizeUrlQuery } from '../../../application/queries/get-google-calendar-authorize-url/get-google-calendar-authorize-url.query';
import { GetGoogleCalendarSyncHandler } from '../../../application/queries/get-google-calendar-sync/get-google-calendar-sync.handler';
import { GetGoogleCalendarSyncQuery } from '../../../application/queries/get-google-calendar-sync/get-google-calendar-sync.query';
import { GetGoogleCalendarAuthorizeUrlRequest } from '../requests/get-google-calendar-authorize-url.request';
import { UpsertGoogleCalendarSyncRequest } from '../requests/upsert-google-calendar-sync.request';

const asOptionalString = (value: unknown) =>
  typeof value === 'string' && value ? value : null;

@Controller()
export class GoogleCalendarController {
  constructor(
    private readonly configService: ConfigService,
    @Inject(
      CALENDAR_SYNC_TYPES.applications.GetGoogleCalendarAuthorizeUrlHandler,
    )
    private readonly getAuthorizeUrlHandler: GetGoogleCalendarAuthorizeUrlHandler,

    @Inject(CALENDAR_SYNC_TYPES.applications.ConnectGoogleCalendarHandler)
    private readonly connectHandler: ConnectGoogleCalendarHandler,

    @Inject(CALENDAR_SYNC_TYPES.applications.DisconnectGoogleCalendarHandler)
    private readonly disconnectHandler: DisconnectGoogleCalendarHandler,

    @Inject(CALENDAR_SYNC_TYPES.applications.GetGoogleCalendarSyncHandler)
    private readonly getSyncHandler: GetGoogleCalendarSyncHandler,

    @Inject(CALENDAR_SYNC_TYPES.applications.UpsertGoogleCalendarSyncHandler)
    private readonly upsertSyncHandler: UpsertGoogleCalendarSyncHandler,

    @Inject(CALENDAR_SYNC_TYPES.applications.DeleteGoogleCalendarSyncHandler)
    private readonly deleteSyncHandler: DeleteGoogleCalendarSyncHandler,

    @Inject(CALENDAR_SYNC_TYPES.applications.RequestGoogleCalendarSyncHandler)
    private readonly requestSyncHandler: RequestGoogleCalendarSyncHandler,
  ) {}

  @Post('integrations/google-calendar/authorize-url')
  @WriteRateLimit()
  @HttpCode(HttpStatus.OK)
  getAuthorizeUrl(
    @Body() request: GetGoogleCalendarAuthorizeUrlRequest,
    @Auth() auth: IAuth,
  ) {
    return this.getAuthorizeUrlHandler.execute(
      new GetGoogleCalendarAuthorizeUrlQuery(auth.id, request.returnTo),
    );
  }

  @Get('integrations/google-calendar/callback')
  @Public()
  @PublicReadRateLimit()
  async callback(
    @Query('code') code: unknown,
    @Query('state') state: unknown,
    @Query('error') error: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.connectHandler.execute(
      new ConnectGoogleCalendarCommand(
        asOptionalString(code),
        asOptionalString(state),
        asOptionalString(error),
      ),
    );

    const origin = resolveFrontendOrigin(this.configService);
    const target = new URL(result.returnTo, origin);
    const url =
      target.origin === new URL(origin).origin ? target : new URL(origin);
    url.searchParams.set('googleCalendar', result.status);

    response.setHeader('Cache-Control', 'no-store');
    response.redirect(303, url.toString());
  }

  @Delete('integrations/google-calendar')
  @WriteRateLimit()
  disconnect(@Auth() auth: IAuth) {
    return this.disconnectHandler.execute(
      new DisconnectGoogleCalendarCommand(auth.id),
    );
  }

  @Get('databases/:databaseId/google-calendar-sync')
  @ReadRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  getSync(@Param('databaseId') databaseId: string, @Auth() auth: IAuth) {
    return this.getSyncHandler.execute(
      new GetGoogleCalendarSyncQuery(databaseId, auth.id),
    );
  }

  @Put('databases/:databaseId/google-calendar-sync')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  upsertSync(
    @Param('databaseId') databaseId: string,
    @Body() request: UpsertGoogleCalendarSyncRequest,
    @Auth() auth: IAuth,
  ) {
    return this.upsertSyncHandler.execute(
      new UpsertGoogleCalendarSyncCommand(
        databaseId,
        request.datePropertyId,
        auth.id,
        request.assignedToMeOnly,
      ),
    );
  }

  @Delete('databases/:databaseId/google-calendar-sync')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  deleteSync(@Param('databaseId') databaseId: string, @Auth() auth: IAuth) {
    return this.deleteSyncHandler.execute(
      new DeleteGoogleCalendarSyncCommand(databaseId, auth.id),
    );
  }

  @Post('databases/:databaseId/google-calendar-sync/run')
  @WriteRateLimit()
  @HttpCode(HttpStatus.ACCEPTED)
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  requestSync(@Param('databaseId') databaseId: string, @Auth() auth: IAuth) {
    return this.requestSyncHandler.execute(
      new RequestGoogleCalendarSyncCommand(databaseId, auth.id),
    );
  }
}
