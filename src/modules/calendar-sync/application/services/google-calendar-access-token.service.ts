import { Inject, Injectable } from '@nestjs/common';

import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import { CALENDAR_SYNC_TYPES } from '../../calendar-sync.types';
import { GoogleCalendarSyncError } from '../../domain/google-calendar-sync-error';
import type {
  GoogleCalendarConnection,
  GoogleCalendarConnectionRepository,
} from '../../domain/repositories/google-calendar-connection.repository';
import {
  GoogleCalendarAccessRevokedError,
  type GoogleCalendarClient,
} from '../ports/google-calendar-client.port';

@Injectable()
export class GoogleCalendarAccessTokenService {
  constructor(
    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarClient)
    private readonly client: GoogleCalendarClient,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository)
    private readonly connectionRepository: GoogleCalendarConnectionRepository,

    private readonly tokenCipher: TokenCipherService,
  ) {}

  async issue(connection: GoogleCalendarConnection): Promise<string | null> {
    try {
      return await this.client.refreshAccessToken(
        this.tokenCipher.decrypt(connection.refreshTokenEncrypted),
      );
    } catch (error) {
      if (error instanceof GoogleCalendarAccessRevokedError) {
        await this.connectionRepository.markError(
          connection.id,
          GoogleCalendarSyncError.ACCESS_REVOKED,
        );
        return null;
      }
      throw error;
    }
  }
}
