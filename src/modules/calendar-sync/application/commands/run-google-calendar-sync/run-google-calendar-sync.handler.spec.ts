import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import { GoogleCalendarSyncError } from '../../../domain/google-calendar-sync-error';
import type { GoogleCalendarSync } from '../../../domain/repositories/google-calendar-sync.repository';
import {
  type GoogleCalendarEvent,
  GoogleCalendarNotFoundError,
  GoogleCalendarRequestError,
} from '../../ports/google-calendar-client.port';
import { RunGoogleCalendarSyncCommand } from './run-google-calendar-sync.command';
import { RunGoogleCalendarSyncHandler } from './run-google-calendar-sync.handler';

const ROW_A = '11111111-1111-4111-8111-111111111111';
const ROW_B = '22222222-2222-4222-8222-222222222222';
const EVENT_A = ROW_A.replace(/-/g, '');
const EVENT_B = ROW_B.replace(/-/g, '');

const property = (id: string, type: PropertyType, position = '0') => ({
  getId: () => id,
  getType: () => type,
  getName: () => id,
  getPosition: () => position,
  getOptions: () => [],
});

const ROW_URL_A = `http://localhost:3000/page/page-1/row/${ROW_A}`;

const row = (id: string, title: string, start: string | null) => ({
  getId: () => id,
  getValues: () => [
    { getPropertyId: () => 'title', getValue: () => title },
    ...(start
      ? [{ getPropertyId: () => 'due', getValue: () => ({ start, end: null }) }]
      : []),
  ],
});

const event = (
  id: string,
  summary: string,
  start: string,
  end: string,
  status = 'confirmed',
  description = `Open in Taskmanly: ${ROW_URL_A}`,
): GoogleCalendarEvent => ({
  id,
  status,
  summary,
  description,
  transparency: 'transparent',
  start: { date: start },
  end: { date: end },
});

describe('RunGoogleCalendarSyncHandler', () => {
  let sync: GoogleCalendarSync;
  let properties: ReturnType<typeof property>[];

  const syncRepository = {
    findById: jest.fn(() => Promise.resolve(sync)),
    markSynced: jest.fn(),
    markFailed: jest.fn(),
  };
  const connectionRepository = {
    findById: jest.fn(() =>
      Promise.resolve({ id: 'connection-1', userId: 'user-1' }),
    ),
  };
  const databaseRepository = {
    findById: jest.fn(() =>
      Promise.resolve({
        getPageId: () => 'page-1',
        getProperties: () => properties,
      }),
    ),
  };
  const databaseRowRepository = { findByDatabaseId: jest.fn() };
  const client = {
    listEvents: jest.fn<Promise<GoogleCalendarEvent[]>, [string, string]>(),
    insertEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };
  const accessTokenService = { issue: jest.fn() };
  const authorizationService = { authorize: jest.fn() };
  const peopleReader = { findByDatabaseId: jest.fn() };
  const configService = { get: jest.fn(() => undefined) };

  const handler = new RunGoogleCalendarSyncHandler(
    syncRepository as never,
    connectionRepository as never,
    databaseRepository as never,
    databaseRowRepository as never,
    client as never,
    accessTokenService as never,
    authorizationService as never,
    peopleReader as never,
    configService as never,
  );
  const run = () => handler.execute(new RunGoogleCalendarSyncCommand('sync-1'));

  beforeEach(() => {
    jest.clearAllMocks();
    sync = {
      id: 'sync-1',
      connectionId: 'connection-1',
      databaseId: 'database-1',
      datePropertyId: 'due',
      assignedToMeOnly: false,
      googleCalendarId: 'calendar-1',
      lastSyncedAt: null,
      lastError: null,
    };
    properties = [
      property('title', PropertyType.TITLE),
      property('due', PropertyType.DATE),
    ];
    authorizationService.authorize.mockResolvedValue(true);
    accessTokenService.issue.mockResolvedValue('access-token');
    client.listEvents.mockResolvedValue([]);
    databaseRowRepository.findByDatabaseId.mockResolvedValue([
      row(ROW_A, 'Launch', '2026-11-10'),
    ]);
  });

  it('creates an all-day event for a new dated row', async () => {
    await run();

    expect(authorizationService.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: ['page_block.read'],
      target: { type: 'page', id: 'page-1' },
    });
    expect(client.insertEvent).toHaveBeenCalledWith(
      'access-token',
      'calendar-1',
      {
        id: EVENT_A,
        summary: 'Launch',
        description: `Open in Taskmanly: ${ROW_URL_A}`,
        startDate: '2026-11-10',
        endDateExclusive: '2026-11-11',
      },
    );
    expect(syncRepository.markSynced).toHaveBeenCalledWith(
      'sync-1',
      expect.any(Date),
    );
  });

  it('only pushes rows assigned to the connected user when asked to', async () => {
    sync.assignedToMeOnly = true;
    properties.push(property('owner', PropertyType.PERSON, '2'));
    peopleReader.findByDatabaseId.mockResolvedValue([]);
    const assigned = (id: string, people: string[]) => ({
      getId: () => id,
      getValues: () => [
        ...row(id, id, '2026-11-10').getValues(),
        { getPropertyId: () => 'owner', getValue: () => people },
      ],
    });
    databaseRowRepository.findByDatabaseId.mockResolvedValue([
      assigned(ROW_A, ['user-1', 'user-2']),
      assigned(ROW_B, ['user-2']),
    ]);
    client.listEvents.mockResolvedValue([
      event(EVENT_B, ROW_B, '2026-11-10', '2026-11-11'),
    ]);

    await run();

    expect(client.insertEvent).toHaveBeenCalledTimes(1);
    expect(client.insertEvent).toHaveBeenCalledWith(
      'access-token',
      'calendar-1',
      expect.objectContaining({ id: EVENT_A }),
    );
    expect(client.deleteEvent).toHaveBeenCalledWith(
      'access-token',
      'calendar-1',
      EVENT_B,
    );
  });

  it('leaves an up-to-date event alone', async () => {
    client.listEvents.mockResolvedValue([
      event(EVENT_A, 'Launch', '2026-11-10', '2026-11-11'),
    ]);

    await run();

    expect(client.insertEvent).not.toHaveBeenCalled();
    expect(client.updateEvent).not.toHaveBeenCalled();
    expect(client.deleteEvent).not.toHaveBeenCalled();
  });

  it('updates an event whose title or date changed', async () => {
    client.listEvents.mockResolvedValue([
      event(EVENT_A, 'Old title', '2026-11-09', '2026-11-10'),
    ]);

    await run();

    expect(client.updateEvent).toHaveBeenCalledWith(
      'access-token',
      'calendar-1',
      expect.objectContaining({ id: EVENT_A, summary: 'Launch' }),
    );
    expect(client.insertEvent).not.toHaveBeenCalled();
  });

  it('adds the row details and link to events created before them', async () => {
    properties.push(property('owner', PropertyType.PERSON, '2'));
    peopleReader.findByDatabaseId.mockResolvedValue([
      { user_id: 'user-9', full_name: 'Nguyen Nam', avatar_url: null },
    ]);
    databaseRowRepository.findByDatabaseId.mockResolvedValue([
      {
        getId: () => ROW_A,
        getValues: () => [
          ...row(ROW_A, 'Launch', '2026-11-10').getValues(),
          { getPropertyId: () => 'owner', getValue: () => ['user-9'] },
        ],
      },
    ]);
    client.listEvents.mockResolvedValue([
      event(EVENT_A, 'Launch', '2026-11-10', '2026-11-11', 'confirmed', ''),
    ]);

    await run();

    expect(peopleReader.findByDatabaseId).toHaveBeenCalledWith('database-1');
    expect(client.updateEvent).toHaveBeenCalledWith(
      'access-token',
      'calendar-1',
      expect.objectContaining({
        id: EVENT_A,
        description: `owner: Nguyen Nam

Open in Taskmanly: ${ROW_URL_A}`,
      }),
    );
  });

  it('marks events that still block busy time for an update', async () => {
    client.listEvents.mockResolvedValue([
      {
        ...event(EVENT_A, 'Launch', '2026-11-10', '2026-11-11'),
        transparency: undefined,
      },
    ]);

    await run();

    expect(client.updateEvent).toHaveBeenCalledTimes(1);
    expect(peopleReader.findByDatabaseId).not.toHaveBeenCalled();
  });

  it('brings back a cancelled event when its row is dated again', async () => {
    client.listEvents.mockResolvedValue([
      event(EVENT_A, 'Launch', '2026-11-10', '2026-11-11', 'cancelled'),
    ]);

    await run();

    expect(client.updateEvent).toHaveBeenCalledTimes(1);
    expect(client.insertEvent).not.toHaveBeenCalled();
  });

  it('deletes events of rows that lost their date or were removed', async () => {
    databaseRowRepository.findByDatabaseId.mockResolvedValue([
      row(ROW_A, 'Launch', '2026-11-10'),
      row(ROW_B, 'No date', null),
    ]);
    client.listEvents.mockResolvedValue([
      event(EVENT_A, 'Launch', '2026-11-10', '2026-11-11'),
      event(EVENT_B, 'No date', '2026-11-01', '2026-11-02'),
      event('deadbeef0000', 'Gone', '2026-11-01', '2026-11-02', 'cancelled'),
    ]);

    await run();

    expect(client.deleteEvent).toHaveBeenCalledTimes(1);
    expect(client.deleteEvent).toHaveBeenCalledWith(
      'access-token',
      'calendar-1',
      EVENT_B,
    );
  });

  it('stops without touching Google when the owner lost access to the page', async () => {
    authorizationService.authorize.mockResolvedValue(false);

    await run();

    expect(syncRepository.markFailed).toHaveBeenCalledWith(
      'sync-1',
      GoogleCalendarSyncError.ACCESS_LOST,
    );
    expect(accessTokenService.issue).not.toHaveBeenCalled();
    expect(client.listEvents).not.toHaveBeenCalled();
  });

  it('keeps the calendar when the date property was deleted', async () => {
    properties = [property('title', PropertyType.TITLE)];

    await run();

    expect(syncRepository.markFailed).toHaveBeenCalledWith(
      'sync-1',
      GoogleCalendarSyncError.DATE_PROPERTY_MISSING,
    );
    expect(client.listEvents).not.toHaveBeenCalled();
    expect(client.deleteEvent).not.toHaveBeenCalled();
  });

  it('keeps the calendar when the date property is no longer a date', async () => {
    properties = [
      property('title', PropertyType.TITLE),
      property('due', PropertyType.TEXT),
    ];

    await run();

    expect(syncRepository.markFailed).toHaveBeenCalledWith(
      'sync-1',
      GoogleCalendarSyncError.DATE_PROPERTY_MISSING,
    );
    expect(client.listEvents).not.toHaveBeenCalled();
  });

  it('marks the sync when Google access was revoked', async () => {
    accessTokenService.issue.mockResolvedValue(null);

    await run();

    expect(syncRepository.markFailed).toHaveBeenCalledWith(
      'sync-1',
      GoogleCalendarSyncError.ACCESS_REVOKED,
    );
    expect(client.listEvents).not.toHaveBeenCalled();
  });

  it('marks the sync when the Google calendar was deleted', async () => {
    client.listEvents.mockRejectedValue(new GoogleCalendarNotFoundError());

    await run();

    expect(syncRepository.markFailed).toHaveBeenCalledWith(
      'sync-1',
      GoogleCalendarSyncError.CALENDAR_MISSING,
    );
    expect(syncRepository.markSynced).not.toHaveBeenCalled();
  });

  it('records a Google failure and rethrows it so the job is retried', async () => {
    client.listEvents.mockRejectedValue(
      new GoogleCalendarRequestError(503, 'unavailable'),
    );

    await expect(run()).rejects.toBeInstanceOf(GoogleCalendarRequestError);
    expect(syncRepository.markFailed).toHaveBeenCalledWith(
      'sync-1',
      GoogleCalendarSyncError.GOOGLE_ERROR,
    );
  });

  it('does nothing for a sync that no longer exists', async () => {
    syncRepository.findById.mockResolvedValueOnce(null as never);

    await run();

    expect(authorizationService.authorize).not.toHaveBeenCalled();
  });
});
