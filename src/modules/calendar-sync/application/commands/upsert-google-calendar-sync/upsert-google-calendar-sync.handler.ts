import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from 'src/modules/database/database.types';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';
import { GoogleCalendarSyncError } from '../../../domain/google-calendar-sync-error';
import type {
  GoogleCalendarConnection,
  GoogleCalendarConnectionRepository,
} from '../../../domain/repositories/google-calendar-connection.repository';
import type { GoogleCalendarSyncRepository } from '../../../domain/repositories/google-calendar-sync.repository';
import {
  type GoogleCalendarClient,
  GoogleCalendarRequestError,
} from '../../ports/google-calendar-client.port';
import type { GoogleCalendarSyncJobQueue } from '../../ports/google-calendar-sync-job-queue.port';
import {
  type GoogleCalendarSyncStatus,
  toGoogleCalendarSyncStatus,
} from '../../queries/get-google-calendar-sync/get-google-calendar-sync.handler';
import { GoogleCalendarAccessTokenService } from '../../services/google-calendar-access-token.service';
import { UpsertGoogleCalendarSyncCommand } from './upsert-google-calendar-sync.command';

@Injectable()
export class UpsertGoogleCalendarSyncHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository)
    private readonly connectionRepository: GoogleCalendarConnectionRepository,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarSyncRepository)
    private readonly syncRepository: GoogleCalendarSyncRepository,

    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarClient)
    private readonly client: GoogleCalendarClient,

    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarSyncJobQueue)
    private readonly jobQueue: GoogleCalendarSyncJobQueue,

    private readonly accessTokenService: GoogleCalendarAccessTokenService,
  ) {}

  async execute(
    command: UpsertGoogleCalendarSyncCommand,
  ): Promise<GoogleCalendarSyncStatus> {
    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const property = database
      .getProperties()
      .find((item) => item.getId() === command.datePropertyId);

    if (property?.getType() !== PropertyType.DATE) {
      throw new BadRequestException(
        'Google Calendar sync needs a Date property',
      );
    }

    const connection = await this.connectionRepository.findByUserId(
      command.userId,
    );

    if (
      !connection ||
      connection.lastError === GoogleCalendarSyncError.ACCESS_REVOKED
    ) {
      throw new ConflictException('Google Calendar is not connected');
    }

    const existing = await this.syncRepository.findByConnectionAndDatabase(
      connection.id,
      command.databaseId,
    );

    const reusableCalendarId =
      existing &&
      existing.lastError !== GoogleCalendarSyncError.CALENDAR_MISSING
        ? existing.googleCalendarId
        : null;

    const googleCalendarId =
      reusableCalendarId ??
      (await this.createCalendar(connection, database.getName()));

    const sync = {
      id: existing?.id ?? randomUUID(),
      connectionId: connection.id,
      databaseId: command.databaseId,
      datePropertyId: command.datePropertyId,
      assignedToMeOnly:
        command.assignedToMeOnly ?? existing?.assignedToMeOnly ?? false,
      googleCalendarId,
      lastSyncedAt: existing?.lastSyncedAt ?? null,
      lastError: null,
    };

    await this.syncRepository.save(sync);
    await this.jobQueue.enqueue(sync.id);

    return toGoogleCalendarSyncStatus(connection, sync);
  }

  private async createCalendar(
    connection: GoogleCalendarConnection,
    databaseName: string,
  ): Promise<string> {
    const accessToken = await this.accessTokenService.issue(connection);

    if (!accessToken) {
      throw new ConflictException('Google Calendar access was revoked');
    }

    try {
      return await this.client.createCalendar(
        accessToken,
        `Taskmanly – ${databaseName}`,
      );
    } catch (error) {
      if (error instanceof GoogleCalendarRequestError) {
        throw new BadGatewayException('Google Calendar is unavailable');
      }
      throw error;
    }
  }
}
