import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';
import type { GoogleCalendarConnectionRepository } from '../../../domain/repositories/google-calendar-connection.repository';
import { GoogleCalendarStateTokenService } from 'src/shared/security/google-calendar-state-token.service';
import type { GoogleCalendarClient } from '../../ports/google-calendar-client.port';
import { ConnectGoogleCalendarCommand } from './connect-google-calendar.command';

export type ConnectGoogleCalendarResult = {
  returnTo: string;
  status: 'connected' | 'error';
};

@Injectable()
export class ConnectGoogleCalendarHandler {
  private readonly logger = new Logger(ConnectGoogleCalendarHandler.name);

  constructor(
    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarClient)
    private readonly client: GoogleCalendarClient,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository)
    private readonly connectionRepository: GoogleCalendarConnectionRepository,

    private readonly stateTokenService: GoogleCalendarStateTokenService,

    private readonly tokenCipher: TokenCipherService,
  ) {}

  async execute(
    command: ConnectGoogleCalendarCommand,
  ): Promise<ConnectGoogleCalendarResult> {
    const state = this.stateTokenService.verify(command.state);

    if (!state) {
      return { returnTo: '/', status: 'error' };
    }

    if (command.error || !command.code) {
      return { returnTo: state.returnTo, status: 'error' };
    }

    try {
      const { refreshToken, email } = await this.client.exchangeCode(
        command.code,
      );
      const existing = await this.connectionRepository.findByUserId(
        state.userId,
      );

      await this.connectionRepository.save({
        id: existing?.id ?? randomUUID(),
        userId: state.userId,
        googleEmail: email,
        refreshTokenEncrypted: this.tokenCipher.encrypt(refreshToken),
        lastError: null,
      });

      return { returnTo: state.returnTo, status: 'connected' };
    } catch (error) {
      this.logger.warn(
        `Google Calendar connection failed: ${(error as Error).message}`,
      );
      return { returnTo: state.returnTo, status: 'error' };
    }
  }
}
