import { Inject, Injectable, Logger } from '@nestjs/common';

import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';
import type {
  GoogleCalendarConnection,
  GoogleCalendarConnectionRepository,
} from '../../../domain/repositories/google-calendar-connection.repository';
import type { GoogleCalendarSyncRepository } from '../../../domain/repositories/google-calendar-sync.repository';
import type { GoogleCalendarClient } from '../../ports/google-calendar-client.port';
import { GoogleCalendarAccessTokenService } from '../../services/google-calendar-access-token.service';
import { DisconnectGoogleCalendarCommand } from './disconnect-google-calendar.command';

@Injectable()
export class DisconnectGoogleCalendarHandler {
  private readonly logger = new Logger(DisconnectGoogleCalendarHandler.name);

  constructor(
    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarClient)
    private readonly client: GoogleCalendarClient,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository)
    private readonly connectionRepository: GoogleCalendarConnectionRepository,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarSyncRepository)
    private readonly syncRepository: GoogleCalendarSyncRepository,

    @Inject(CALENDAR_SYNC_TYPES.services.GoogleCalendarAccessTokenService)
    private readonly accessTokenService: GoogleCalendarAccessTokenService,

    private readonly tokenCipher: TokenCipherService,
  ) {}

  async execute(command: DisconnectGoogleCalendarCommand): Promise<void> {
    const connection = await this.connectionRepository.findByUserId(
      command.userId,
    );

    if (!connection) {
      return;
    }

    await this.deleteCalendars(connection);
    await this.connectionRepository.deleteByUserId(command.userId);

    try {
      await this.client.revoke(
        this.tokenCipher.decrypt(connection.refreshTokenEncrypted),
      );
    } catch (error) {
      this.logger.warn(
        `Google Calendar token revoke failed: ${(error as Error).message}`,
      );
    }
  }

  private async deleteCalendars(
    connection: GoogleCalendarConnection,
  ): Promise<void> {
    const syncs = await this.syncRepository.findByConnectionId(connection.id);

    if (syncs.length === 0) {
      return;
    }

    let accessToken: string | null;

    try {
      accessToken = await this.accessTokenService.issue(connection);
    } catch (error) {
      this.logger.warn(
        `Google calendar cleanup skipped: ${(error as Error).message}`,
      );
      return;
    }

    if (!accessToken) {
      return;
    }

    for (const sync of syncs) {
      try {
        await this.client.deleteCalendar(accessToken, sync.googleCalendarId);
      } catch (error) {
        this.logger.warn(
          `Google calendar cleanup failed: ${(error as Error).message}`,
        );
      }
    }
  }
}
