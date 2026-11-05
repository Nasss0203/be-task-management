import { Inject, Injectable, Logger } from '@nestjs/common';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';
import type { GoogleCalendarConnectionRepository } from '../../../domain/repositories/google-calendar-connection.repository';
import type { GoogleCalendarSyncRepository } from '../../../domain/repositories/google-calendar-sync.repository';
import type { GoogleCalendarClient } from '../../ports/google-calendar-client.port';
import { GoogleCalendarAccessTokenService } from '../../services/google-calendar-access-token.service';
import { DeleteGoogleCalendarSyncCommand } from './delete-google-calendar-sync.command';

@Injectable()
export class DeleteGoogleCalendarSyncHandler {
  private readonly logger = new Logger(DeleteGoogleCalendarSyncHandler.name);

  constructor(
    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository)
    private readonly connectionRepository: GoogleCalendarConnectionRepository,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarSyncRepository)
    private readonly syncRepository: GoogleCalendarSyncRepository,

    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarClient)
    private readonly client: GoogleCalendarClient,

    private readonly accessTokenService: GoogleCalendarAccessTokenService,
  ) {}

  async execute(command: DeleteGoogleCalendarSyncCommand): Promise<void> {
    const connection = await this.connectionRepository.findByUserId(
      command.userId,
    );
    const sync = connection
      ? await this.syncRepository.findByConnectionAndDatabase(
          connection.id,
          command.databaseId,
        )
      : null;

    if (!connection || !sync) {
      return;
    }

    await this.syncRepository.delete(sync.id);

    try {
      const accessToken = await this.accessTokenService.issue(connection);

      if (accessToken) {
        await this.client.deleteCalendar(accessToken, sync.googleCalendarId);
      }
    } catch (error) {
      this.logger.warn(
        `Google calendar cleanup failed: ${(error as Error).message}`,
      );
    }
  }
}
