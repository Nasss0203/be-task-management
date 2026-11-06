import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { resolveFrontendOrigin } from 'src/common/config/frontend-origin.config';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { DatabasePeopleReader } from 'src/modules/database/application/ports/database-people-reader.port';
import { collectCalendarEntries } from 'src/modules/database/application/services/calendar-ics';
import type { DatabaseProperty } from 'src/modules/database/domain/aggregates/database/database-property.entity';
import type { DatabaseRow } from 'src/modules/database/domain/aggregates/row/database-row.aggregate';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { DatabaseRowRepository } from 'src/modules/database/domain/repositories/database-row.repository';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';
import { GoogleCalendarSyncError } from '../../../domain/google-calendar-sync-error';
import type { GoogleCalendarConnectionRepository } from '../../../domain/repositories/google-calendar-connection.repository';
import type {
  GoogleCalendarSync,
  GoogleCalendarSyncRepository,
} from '../../../domain/repositories/google-calendar-sync.repository';
import {
  type GoogleCalendarClient,
  type GoogleCalendarEvent,
  type GoogleCalendarEventInput,
  GoogleCalendarNotFoundError,
  GoogleCalendarRequestError,
} from '../../ports/google-calendar-client.port';
import { GoogleCalendarAccessTokenService } from '../../services/google-calendar-access-token.service';
import { buildEventDescription } from '../../services/google-calendar-event-description';
import { RunGoogleCalendarSyncCommand } from './run-google-calendar-sync.command';

const toEventId = (rowId: string) => rowId.replace(/-/g, '');

const isAssignedTo = (
  row: DatabaseRow,
  personPropertyIds: ReadonlySet<string>,
  userId: string,
) =>
  row.getValues().some((value) => {
    const people = value.getValue();
    return (
      personPropertyIds.has(value.getPropertyId()) &&
      Array.isArray(people) &&
      people.includes(userId)
    );
  });

const isUpToDate = (
  event: GoogleCalendarEvent,
  input: GoogleCalendarEventInput,
) =>
  event.status !== 'cancelled' &&
  event.summary === input.summary &&
  (event.description ?? '') === input.description &&
  event.transparency === 'transparent' &&
  event.start?.date === input.startDate &&
  event.end?.date === input.endDateExclusive;

@Injectable()
export class RunGoogleCalendarSyncHandler {
  constructor(
    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarSyncRepository)
    private readonly syncRepository: GoogleCalendarSyncRepository,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository)
    private readonly connectionRepository: GoogleCalendarConnectionRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,

    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarClient)
    private readonly client: GoogleCalendarClient,

    @Inject(CALENDAR_SYNC_TYPES.services.GoogleCalendarAccessTokenService)
    private readonly accessTokenService: GoogleCalendarAccessTokenService,

    private readonly authorizationService: AuthorizationService,

    @Inject(DATABASE_TYPES.ports.DatabasePeopleReader)
    private readonly peopleReader: DatabasePeopleReader,

    private readonly configService: ConfigService,
  ) {}

  async execute(command: RunGoogleCalendarSyncCommand): Promise<void> {
    const sync = await this.syncRepository.findById(command.syncId);
    const connection = sync
      ? await this.connectionRepository.findById(sync.connectionId)
      : null;
    const database = sync
      ? await this.databaseRepository.findById(sync.databaseId)
      : null;

    if (!sync || !connection || !database) {
      return;
    }

    const allowed = await this.authorizationService.authorize({
      userId: connection.userId,
      permissions: [PERMISSIONS.PAGE_BLOCK_READ],
      target: { type: 'page', id: database.getPageId() },
    });

    if (!allowed) {
      return this.syncRepository.markFailed(
        sync.id,
        GoogleCalendarSyncError.ACCESS_LOST,
      );
    }

    const properties = database.getProperties();
    const dateProperty = properties.find(
      (property) =>
        property.getId() === sync.datePropertyId &&
        property.getType() === PropertyType.DATE,
    );

    if (!dateProperty) {
      return this.syncRepository.markFailed(
        sync.id,
        GoogleCalendarSyncError.DATE_PROPERTY_MISSING,
      );
    }

    const accessToken = await this.accessTokenService.issue(connection);

    if (!accessToken) {
      return this.syncRepository.markFailed(
        sync.id,
        GoogleCalendarSyncError.ACCESS_REVOKED,
      );
    }

    const allRows = await this.databaseRowRepository.findByDatabaseId(
      sync.databaseId,
    );
    const personPropertyIds = new Set(
      properties
        .filter((property) => property.getType() === PropertyType.PERSON)
        .map((property) => property.getId()),
    );
    const rows = sync.assignedToMeOnly
      ? allRows.filter((row) =>
          isAssignedTo(row, personPropertyIds, connection.userId),
        )
      : allRows;
    const inputs = await this.toEventInputs(
      sync,
      database.getPageId(),
      properties,
      rows,
    );

    try {
      await this.pushEvents(accessToken, sync, inputs);
    } catch (error) {
      if (error instanceof GoogleCalendarNotFoundError) {
        return this.syncRepository.markFailed(
          sync.id,
          GoogleCalendarSyncError.CALENDAR_MISSING,
        );
      }
      if (error instanceof GoogleCalendarRequestError) {
        await this.syncRepository.markFailed(
          sync.id,
          GoogleCalendarSyncError.GOOGLE_ERROR,
        );
      }
      throw error;
    }

    await this.syncRepository.markSynced(sync.id, new Date());
  }

  private async toEventInputs(
    sync: GoogleCalendarSync,
    pageId: string,
    properties: readonly DatabaseProperty[],
    rows: readonly DatabaseRow[],
  ): Promise<GoogleCalendarEventInput[]> {
    const rowsById = new Map(rows.map((row) => [row.getId(), row]));
    const peopleNames = properties.some(
      (property) => property.getType() === PropertyType.PERSON,
    )
      ? new Map(
          (await this.peopleReader.findByDatabaseId(sync.databaseId)).map(
            (person) => [person.user_id, person.full_name],
          ),
        )
      : new Map<string, string>();
    const origin = resolveFrontendOrigin(this.configService);

    return collectCalendarEntries({
      titlePropertyId:
        properties
          .find((property) => property.getType() === PropertyType.TITLE)
          ?.getId() ?? null,
      datePropertyId: sync.datePropertyId,
      rows,
    }).map((entry) => ({
      id: toEventId(entry.rowId),
      summary: entry.title,
      description: buildEventDescription({
        properties,
        row: rowsById.get(entry.rowId)!,
        datePropertyId: sync.datePropertyId,
        peopleNames,
        rowUrl: new URL(
          `/page/${pageId}/row/${entry.rowId}`,
          origin,
        ).toString(),
      }),
      startDate: entry.startDate,
      endDateExclusive: entry.endDateExclusive,
    }));
  }

  private async pushEvents(
    accessToken: string,
    sync: GoogleCalendarSync,
    inputs: readonly GoogleCalendarEventInput[],
  ): Promise<void> {
    const calendarId = sync.googleCalendarId;
    const pending = new Map(inputs.map((input) => [input.id, input]));

    for (const event of await this.client.listEvents(accessToken, calendarId)) {
      const input = pending.get(event.id);
      pending.delete(event.id);

      if (!input) {
        if (event.status !== 'cancelled') {
          await this.client.deleteEvent(accessToken, calendarId, event.id);
        }
      } else if (!isUpToDate(event, input)) {
        await this.client.updateEvent(accessToken, calendarId, input);
      }
    }

    for (const input of pending.values()) {
      await this.client.insertEvent(accessToken, calendarId, input);
    }
  }
}
