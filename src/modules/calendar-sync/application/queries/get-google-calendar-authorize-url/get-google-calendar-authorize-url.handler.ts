import { Inject, Injectable } from '@nestjs/common';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';
import { GoogleCalendarStateTokenService } from 'src/shared/security/google-calendar-state-token.service';
import type { GoogleCalendarClient } from '../../ports/google-calendar-client.port';
import { GetGoogleCalendarAuthorizeUrlQuery } from './get-google-calendar-authorize-url.query';

@Injectable()
export class GetGoogleCalendarAuthorizeUrlHandler {
  constructor(
    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarClient)
    private readonly client: GoogleCalendarClient,

    private readonly stateTokenService: GoogleCalendarStateTokenService,
  ) {}

  execute(query: GetGoogleCalendarAuthorizeUrlQuery): { url: string } {
    const state = this.stateTokenService.generate({
      userId: query.userId,
      returnTo: query.returnTo,
    });

    return { url: this.client.buildAuthorizeUrl(state) };
  }
}
