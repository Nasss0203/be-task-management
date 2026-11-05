import { Inject, Injectable, Logger } from '@nestjs/common';

import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';
import type { GoogleCalendarConnectionRepository } from '../../../domain/repositories/google-calendar-connection.repository';
import type { GoogleCalendarClient } from '../../ports/google-calendar-client.port';
import { DisconnectGoogleCalendarCommand } from './disconnect-google-calendar.command';

@Injectable()
export class DisconnectGoogleCalendarHandler {
  private readonly logger = new Logger(DisconnectGoogleCalendarHandler.name);

  constructor(
    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarClient)
    private readonly client: GoogleCalendarClient,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository)
    private readonly connectionRepository: GoogleCalendarConnectionRepository,

    private readonly tokenCipher: TokenCipherService,
  ) {}

  async execute(command: DisconnectGoogleCalendarCommand): Promise<void> {
    const connection = await this.connectionRepository.findByUserId(
      command.userId,
    );

    if (!connection) {
      return;
    }

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
}
