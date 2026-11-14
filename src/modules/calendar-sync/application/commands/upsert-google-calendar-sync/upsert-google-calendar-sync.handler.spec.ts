import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import { GoogleCalendarSyncError } from '../../../domain/google-calendar-sync-error';
import { GoogleCalendarRequestError } from '../../ports/google-calendar-client.port';
import { UpsertGoogleCalendarSyncCommand } from './upsert-google-calendar-sync.command';
import { UpsertGoogleCalendarSyncHandler } from './upsert-google-calendar-sync.handler';

describe('UpsertGoogleCalendarSyncHandler', () => {
  const connection = {
    id: 'connection-1',
    userId: 'user-1',
    googleEmail: 'me@example.com',
    refreshTokenEncrypted: 'enc',
    lastError: null,
  };
  const databaseRepository = { findById: jest.fn() };
  const connectionRepository = { findByUserId: jest.fn() };
  const syncRepository = {
    findByConnectionAndDatabase: jest.fn(),
    save: jest.fn<Promise<void>, [{ id: string }]>(),
  };
  const client = { createCalendar: jest.fn() };
  const jobQueue = { enqueue: jest.fn() };
  const accessTokenService = { issue: jest.fn() };
  const handler = new UpsertGoogleCalendarSyncHandler(
    databaseRepository as never,
    connectionRepository as never,
    syncRepository as never,
    client as never,
    jobQueue as never,
    accessTokenService as never,
  );
  const upsert = (datePropertyId = 'due', assignedToMeOnly?: boolean) =>
    handler.execute(
      new UpsertGoogleCalendarSyncCommand(
        'database-1',
        datePropertyId,
        'user-1',
        assignedToMeOnly,
      ),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    databaseRepository.findById.mockResolvedValue({
      getName: () => 'Roadmap',
      getProperties: () => [
        { getId: () => 'title', getType: () => PropertyType.TITLE },
        { getId: () => 'due', getType: () => PropertyType.DATE },
      ],
    });
    connectionRepository.findByUserId.mockResolvedValue(connection);
    syncRepository.findByConnectionAndDatabase.mockResolvedValue(null);
    accessTokenService.issue.mockResolvedValue('access-token');
    client.createCalendar.mockResolvedValue('calendar-1');
  });

  it('creates a dedicated calendar, saves the sync and queues a first run', async () => {
    const result = await upsert();

    expect(client.createCalendar).toHaveBeenCalledWith(
      'access-token',
      'Taskmanly – Roadmap',
    );
    const saved = syncRepository.save.mock.calls[0][0];
    expect(saved).toEqual(
      expect.objectContaining({
        connectionId: 'connection-1',
        databaseId: 'database-1',
        datePropertyId: 'due',
        assignedToMeOnly: false,
        googleCalendarId: 'calendar-1',
        lastError: null,
      }),
    );
    expect(jobQueue.enqueue).toHaveBeenCalledWith(saved.id);
    expect(result).toEqual({
      connected: true,
      googleEmail: 'me@example.com',
      connectionError: null,
      sync: {
        datePropertyId: 'due',
        assignedToMeOnly: false,
        lastSyncedAt: null,
        lastError: null,
      },
    });
  });

  it('keeps the existing calendar when only the date property changes', async () => {
    syncRepository.findByConnectionAndDatabase.mockResolvedValue({
      id: 'sync-1',
      googleCalendarId: 'calendar-old',
      lastSyncedAt: null,
      lastError: GoogleCalendarSyncError.DATE_PROPERTY_MISSING,
    });

    await upsert();

    expect(client.createCalendar).not.toHaveBeenCalled();
    expect(syncRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'sync-1',
        googleCalendarId: 'calendar-old',
        lastError: null,
      }),
    );
  });

  it.each([
    [undefined, true],
    [false, false],
  ])(
    'keeps the assignee filter unless the request sets it (%s)',
    async (requested, expected) => {
      syncRepository.findByConnectionAndDatabase.mockResolvedValue({
        id: 'sync-1',
        googleCalendarId: 'calendar-old',
        assignedToMeOnly: true,
        lastSyncedAt: null,
        lastError: null,
      });

      await upsert('due', requested);

      expect(syncRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ assignedToMeOnly: expected }),
      );
    },
  );

  it('creates a new calendar when the old one was deleted in Google', async () => {
    syncRepository.findByConnectionAndDatabase.mockResolvedValue({
      id: 'sync-1',
      googleCalendarId: 'calendar-old',
      lastSyncedAt: null,
      lastError: GoogleCalendarSyncError.CALENDAR_MISSING,
    });

    await upsert();

    expect(syncRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sync-1', googleCalendarId: 'calendar-1' }),
    );
  });

  it('rejects a property that is not a date', async () => {
    await expect(upsert('title')).rejects.toBeInstanceOf(BadRequestException);
    expect(syncRepository.save).not.toHaveBeenCalled();
  });

  it.each([
    ['not connected', null],
    [
      'revoked',
      { ...connection, lastError: GoogleCalendarSyncError.ACCESS_REVOKED },
    ],
  ])('asks to connect first when Google is %s', async (_label, current) => {
    connectionRepository.findByUserId.mockResolvedValue(current);

    await expect(upsert()).rejects.toBeInstanceOf(ConflictException);
    expect(client.createCalendar).not.toHaveBeenCalled();
  });

  it('reports a revoked token found while creating the calendar', async () => {
    accessTokenService.issue.mockResolvedValue(null);

    await expect(upsert()).rejects.toBeInstanceOf(ConflictException);
    expect(syncRepository.save).not.toHaveBeenCalled();
  });

  it('reports Google being down as a bad gateway', async () => {
    client.createCalendar.mockRejectedValue(
      new GoogleCalendarRequestError(503, 'unavailable'),
    );

    await expect(upsert()).rejects.toBeInstanceOf(BadGatewayException);
    expect(syncRepository.save).not.toHaveBeenCalled();
  });
});
